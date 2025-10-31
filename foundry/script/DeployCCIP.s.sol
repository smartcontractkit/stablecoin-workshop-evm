// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {BurnMintTokenPool} from "@chainlink/contracts-ccip/contracts/pools/BurnMintTokenPool.sol";
import {TokenAdminRegistry} from "@chainlink/contracts-ccip/contracts/tokenAdminRegistry/TokenAdminRegistry.sol";
import {RegistryModuleOwnerCustom} from "@chainlink/contracts-ccip/contracts/tokenAdminRegistry/RegistryModuleOwnerCustom.sol";
import {IBurnMintERC20} from "@chainlink/contracts/src/v0.8/shared/token/ERC20/IBurnMintERC20.sol";
import {RateLimiter} from "@chainlink/contracts-ccip/contracts/libraries/RateLimiter.sol";
import {TokenPool} from "@chainlink/contracts-ccip/contracts/pools/TokenPool.sol";

contract DeployCCIP is Script {
    HelperConfig public helperConfig;

    address public fromStablecoinAddress;
    address public toStablecoinAddress;

    address public fromPoolAddress;
    address public toPoolAddress;

    function run() external {
        helperConfig = new HelperConfig();

        fromStablecoinAddress = vm.envAddress("STABLECOIN_CONTRACT_ADDRESS_FROM");
        toStablecoinAddress = vm.envAddress("STABLECOIN_CONTRACT_ADDRESS_TO");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        string memory arbitrumSepoliaRpcUrl = vm.envString("ARBITRUM_SEPOLIA_RPC_URL");
        string memory avalancheFujiRpcUrl = vm.envString("AVALANCHE_FUJI_RPC_URL");

        HelperConfig.NetworkConfig memory fromConfig = helperConfig.getArbitrumSepoliaConfig();
        HelperConfig.NetworkConfig memory toConfig = helperConfig.getAvalancheFujiConfig();

        // Deploy and configure on Arbitrum Sepolia
        uint256 fromFork = vm.createSelectFork(arbitrumSepoliaRpcUrl);
        vm.selectFork(fromFork);
        vm.startBroadcast(deployerPrivateKey);
        fromPoolAddress = deployTokenPool(fromConfig, fromStablecoinAddress);
        registerAdmin(fromConfig, fromStablecoinAddress);
        acceptAdmin(fromConfig, fromStablecoinAddress);
        setPool(fromConfig, fromStablecoinAddress, fromPoolAddress);
        vm.stopBroadcast();

        // Deploy and configure on Avalanche Fuji
        uint256 toFork = vm.createSelectFork(avalancheFujiRpcUrl);
        vm.selectFork(toFork);
        vm.startBroadcast(deployerPrivateKey);
        toPoolAddress = deployTokenPool(toConfig, toStablecoinAddress);
        registerAdmin(toConfig, toStablecoinAddress);
        acceptAdmin(toConfig, toStablecoinAddress);
        setPool(toConfig, toStablecoinAddress, toPoolAddress);
        vm.stopBroadcast();

        // Configure cross-chain routes
        vm.selectFork(fromFork);
        vm.startBroadcast(deployerPrivateKey);
        applyChainUpdates(fromPoolAddress, toConfig, toPoolAddress, toStablecoinAddress);
        vm.stopBroadcast();

        vm.selectFork(toFork);
        vm.startBroadcast(deployerPrivateKey);
        applyChainUpdates(toPoolAddress, fromConfig, fromPoolAddress, fromStablecoinAddress);
        vm.stopBroadcast();
    }

    function deployTokenPool(HelperConfig.NetworkConfig memory config, address tokenAddress) internal returns (address) {
        // Deploy BurnMintTokenPool directly - no wrapper needed
        BurnMintTokenPool pool = new BurnMintTokenPool(
            IBurnMintERC20(tokenAddress),
            18,  // localTokenDecimals
            new address[](0),  // allowlist (empty)
            config.rmnProxy,
            config.router
        );
        
        console.log("TokenPool deployed at:", address(pool));
        
        // Grant mint and burn roles to the pool
        // StablecoinERC20 has a grantMintAndBurnRoles() convenience function
        (bool success, ) = tokenAddress.call(
            abi.encodeWithSignature("grantMintAndBurnRoles(address)", address(pool))
        );
        require(success, "Failed to grant mint/burn roles");
        
        console.log("Granted mint/burn roles to pool");
        
        return address(pool);
    }

    function registerAdmin(HelperConfig.NetworkConfig memory config, address tokenAddress) internal {
        console.log("Registering admin for token:", tokenAddress);
        RegistryModuleOwnerCustom(config.registryModuleOwnerCustom).registerAdminViaOwner(tokenAddress);
        console.log("Admin registered");
    }

    function acceptAdmin(HelperConfig.NetworkConfig memory config, address tokenAddress) internal {
        console.log("Accepting admin role for token:", tokenAddress);
        TokenAdminRegistry(config.tokenAdminRegistry).acceptAdminRole(tokenAddress);
        console.log("Admin role accepted");
    }

    function setPool(HelperConfig.NetworkConfig memory config, address tokenAddress, address poolAddress) internal {
        console.log("Setting pool for token:", tokenAddress);
        console.log("Pool address:", poolAddress);
        TokenAdminRegistry(config.tokenAdminRegistry).setPool(tokenAddress, poolAddress);
        console.log("Pool set in TokenAdminRegistry");
    }

    function applyChainUpdates(
        address poolAddress,
        HelperConfig.NetworkConfig memory remoteConfig,
        address remotePool,
        address remoteToken
    ) internal {
        console.log("Applying chain updates to pool:", poolAddress);
        console.log("Remote chain selector:", remoteConfig.chainSelector);
        console.log("Remote pool:", remotePool);
        console.log("Remote token:", remoteToken);
        
        TokenPool.ChainUpdate[] memory updates = new TokenPool.ChainUpdate[](1);
        bytes[] memory remotePoolAddresses = new bytes[](1);
        remotePoolAddresses[0] = abi.encode(remotePool);

        updates[0] = TokenPool.ChainUpdate({
            remoteChainSelector: remoteConfig.chainSelector,
            remotePoolAddresses: remotePoolAddresses,
            remoteTokenAddress: abi.encode(remoteToken),
            outboundRateLimiterConfig: RateLimiter.Config(false, 0, 0),
            inboundRateLimiterConfig: RateLimiter.Config(false, 0, 0)
        });
        TokenPool(poolAddress).applyChainUpdates(new uint64[](0), updates);
        
        console.log("Chain updates applied successfully");
    }
}