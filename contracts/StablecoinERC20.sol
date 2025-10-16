// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IDataStreamsOracle} from "./interfaces/IDataStreamsOracle.sol";

/**
 * @title StablecoinERC20
 * @notice Oracle-backed stablecoin with CCIP burn/mint support
 * @dev Implements CCIP-compatible burn/mint pattern with role management
 * 
 * Key Features:
 * - ETH collateral vault (held in contract balance)
 * - Oracle-backed minting via depositAndMint()
 * - Current price withdrawals via burnAndWithdraw()
 * - Dual mint authority: Anyone (via depositAndMint) + CCIP TokenPool (via mint)
 * - CCIP-compatible for cross-chain transfers
 * 
 * Decimal Handling:
 * - Stablecoin: 18 decimals (ERC20 standard)
 * - Oracle price: 18 decimals (Data Streams crypto feeds)
 * - ETH: 18 decimals (wei)
 * 
 * Security Note:
 * - Simplified for workshop purposes
 * - Production use requires: collateralization ratio checks, liquidations,
 *   access controls, pause functionality, and comprehensive audits
 */
contract StablecoinERC20 is ERC20, ERC20Burnable, Ownable {
    IDataStreamsOracle public immutable oracle;
    bytes32 public immutable feedId;
    uint256 public immutable maxSupply;
    
    uint256 public totalCollateral;
    
    // CCIP TokenPool role management
    mapping(address => bool) private s_minters;
    mapping(address => bool) private s_burners;
    
    event CollateralDeposited(
        address indexed user,
        uint256 ethAmount,
        uint256 stablecoinsMinted,
        int192 oraclePrice
    );
    
    event CollateralWithdrawn(
        address indexed user,
        uint256 ethAmount,
        uint256 stablecoinsBurned,
        int192 oraclePrice
    );
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event BurnerAdded(address indexed burner);
    event BurnerRemoved(address indexed burner);
    
    error ZeroAmount();
    error OraclePriceInvalid();
    error InsufficientCollateral();
    error MaxSupplyExceeded();
    error OnlyMinter();
    error OnlyBurner();
    
    /**
     * @notice Construct the stablecoin with oracle backing
     * @param name Token name (e.g., "Oracle-Backed Stablecoin")
     * @param symbol Token symbol (e.g., "OBSC")
     * @param maxSupply_ Maximum supply (0 for unlimited)
     * @param _oracle Oracle contract address
     * @param _feedId Data Streams feed ID (e.g., ETH/USD)
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 maxSupply_,
        address _oracle,
        bytes32 _feedId
    ) ERC20(name, symbol) Ownable() {
        maxSupply = maxSupply_;
        oracle = IDataStreamsOracle(_oracle);
        feedId = _feedId;
    }
    
    // ================== CCIP Role Management ==================
    
    modifier onlyMinter() {
        if (!s_minters[msg.sender]) revert OnlyMinter();
        _;
    }
    
    modifier onlyBurner() {
        if (!s_burners[msg.sender]) revert OnlyBurner();
        _;
    }
    
    function grantMintRole(address minter) external onlyOwner {
        s_minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    function revokeMintRole(address minter) external onlyOwner {
        s_minters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    function grantBurnRole(address burner) external onlyOwner {
        s_burners[burner] = true;
        emit BurnerAdded(burner);
    }
    
    function revokeBurnRole(address burner) external onlyOwner {
        s_burners[burner] = false;
        emit BurnerRemoved(burner);
    }
    
    /**
     * @notice Convenience function to grant both mint and burn roles in one call
     * @dev Used by CCIP TokenPool deployment script
     * @param burnAndMinter The address to grant both roles to (typically a TokenPool)
     */
    function grantMintAndBurnRoles(address burnAndMinter) external onlyOwner {
        s_minters[burnAndMinter] = true;
        emit MinterAdded(burnAndMinter);
        s_burners[burnAndMinter] = true;
        emit BurnerAdded(burnAndMinter);
    }
    
    function isMinter(address account) external view returns (bool) {
        return s_minters[account];
    }
    
    function isBurner(address account) external view returns (bool) {
        return s_burners[account];
    }
    
    // ================== CCIP Mint/Burn Functions ==================
    
    /**
     * @notice Mint tokens (called by CCIP TokenPool)
     * @dev Only addresses with minter role can call this
     */
    function mint(address account, uint256 amount) external onlyMinter {
        if (maxSupply > 0 && totalSupply() + amount > maxSupply) {
            revert MaxSupplyExceeded();
        }
        _mint(account, amount);
    }
    
    /**
     * @notice Burn tokens from account (called by CCIP TokenPool)
     * @dev Only addresses with burner role can call this
     * @dev Overrides ERC20Burnable to add role check
     */
    function burnFrom(address account, uint256 amount) public override onlyBurner {
        _burn(account, amount);
    }
    
    // ================== Oracle-Backed Mint/Burn ==================
    
    /**
     * @notice Deposit ETH and mint stablecoins based on oracle price
     * @return mintAmount Amount of stablecoins minted
     * @dev Uses _mint() (internal) to bypass role checks - this is permissionless
     * @dev Oracle price is 18 decimals, ETH is 18 decimals, result is 18 decimals
     * 
     * Calculation:
     * usdValue = (msg.value * ethUsdPrice) / 1e18
     * 
     * Example:
     * msg.value = 0.5 ETH = 500000000000000000 wei
     * ethUsdPrice = $4,340 = 4340000000000000000000 (18 decimals)
     * usdValue = (500000000000000000 × 4340000000000000000000) / 1e18
     *          = 2170000000000000000000 (2,170 stablecoins with 18 decimals)
     */
    function depositAndMint() external payable returns (uint256 mintAmount) {
        if (msg.value == 0) revert ZeroAmount();
        
        // Query oracle for current ETH/USD price
        (int192 ethUsdPrice, ) = oracle.getLatestPrice();
        if (ethUsdPrice <= 0) revert OraclePriceInvalid();
        
        // Calculate USD value: (ETH amount × price) / 1e18
        // msg.value: 18 decimals (wei)
        // ethUsdPrice: 18 decimals (oracle)
        // Result: 18 decimals (stablecoin)
        uint256 priceUint = ethUsdPrice >= 0 ? uint256(uint192(ethUsdPrice)) : 0;
        uint256 usdValue = (msg.value * priceUint) / 1e18;
        
        // Mint stablecoins to user (bypasses role check - permissionless)
        _mint(msg.sender, usdValue);
        
        // Track total collateral
        totalCollateral += msg.value;
        
        emit CollateralDeposited(msg.sender, msg.value, usdValue, ethUsdPrice);
        
        return usdValue;
    }
    
    /**
     * @notice Burn stablecoins and withdraw ETH based on current oracle price
     * @param stablecoinAmount Amount of stablecoins to burn (18 decimals)
     * @return ethReturned Amount of ETH returned (wei)
     * @dev Uses current oracle price (not original deposit price)
     * 
     * Calculation:
     * ethToReturn = (stablecoinAmount * 1e18) / ethUsdPrice
     * 
     * Example:
     * stablecoinAmount = 2,170 = 2170000000000000000000 (18 decimals)
     * ethUsdPrice = $4,340 = 4340000000000000000000 (18 decimals)
     * ethToReturn = (2170000000000000000000 × 1e18) / 4340000000000000000000
     *             = 500000000000000000 (0.5 ETH)
     */
    function burnAndWithdraw(uint256 stablecoinAmount) external returns (uint256 ethReturned) {
        if (stablecoinAmount == 0) revert ZeroAmount();
        if (balanceOf(msg.sender) < stablecoinAmount) revert InsufficientCollateral();
        
        // Query oracle for current ETH/USD price
        (int192 ethUsdPrice, ) = oracle.getLatestPrice();
        if (ethUsdPrice <= 0) revert OraclePriceInvalid();
        
        // Calculate ETH to return: (USD value × 1e18) / price
        // stablecoinAmount: 18 decimals (USD value)
        // ethUsdPrice: 18 decimals (oracle)
        // Result: 18 decimals (wei)
        uint256 priceUint = ethUsdPrice >= 0 ? uint256(uint192(ethUsdPrice)) : 0;
        uint256 ethToReturn = (stablecoinAmount * 1e18) / priceUint;
        
        // Check contract has enough ETH
        if (address(this).balance < ethToReturn) revert InsufficientCollateral();
        
        // Burn stablecoins from user
        _burn(msg.sender, stablecoinAmount);
        
        // Update collateral tracking
        totalCollateral -= ethToReturn;
        
        // Transfer ETH to user
        (bool success, ) = msg.sender.call{value: ethToReturn}("");
        require(success, "ETH transfer failed");
        
        emit CollateralWithdrawn(msg.sender, ethToReturn, stablecoinAmount, ethUsdPrice);
        
        return ethReturned;
    }
    
    /**
     * @notice Get current collateralization status
     * @return collateralValue Total ETH collateral value in USD (18 decimals)
     * @return stablecoinSupply Total stablecoin supply (18 decimals)
     * @return collateralizationRatio Ratio as percentage (e.g., 15000 = 150%)
     */
    function getCollateralizationStatus() 
        external 
        view 
        returns (
            uint256 collateralValue,
            uint256 stablecoinSupply,
            uint256 collateralizationRatio
        ) 
    {
        (int192 ethUsdPrice, ) = oracle.getLatestPrice();
        
        if (ethUsdPrice > 0) {
            uint256 priceUint = uint256(uint192(ethUsdPrice));
            collateralValue = (totalCollateral * priceUint) / 1e18;
        }
        
        stablecoinSupply = totalSupply();
        
        if (stablecoinSupply > 0) {
            // Ratio = (collateralValue × 10000) / stablecoinSupply
            // Result is in basis points (10000 = 100%)
            collateralizationRatio = (collateralValue * 10000) / stablecoinSupply;
        }
        
        return (collateralValue, stablecoinSupply, collateralizationRatio);
    }
}

