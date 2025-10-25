// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {IDataStreamsOracle} from "./interfaces/IDataStreamsOracle.sol";

/**
 * @title DataStreamsOracle
 * @notice Price Feed Oracle wrapper for workshop purposes
 * @dev This contract wraps Chainlink Price Feeds (formerly Data Feeds) to provide
 *      a consistent interface for the stablecoin contract.
 *
 * Key Features:
 * 1. Reads from on-chain Chainlink Price Feed Aggregator contracts
 * 2. Automatically updated by Chainlink DON (Decentralized Oracle Network)
 * 3. No manual updates needed - prices are always fresh
 * 4. Converts 8-decimal price feeds to 18-decimal format for consistency
 */
contract DataStreamsOracle is IDataStreamsOracle {
    struct PriceData {
        int192 price;        // Price with 18 decimals (converted from feed decimals)
        uint32 timestamp;    // Unix timestamp
    }

    bytes32 public immutable override feedId;
    AggregatorV3Interface public immutable priceFeed;
    uint8 public immutable feedDecimals;
    PriceData public latestPrice;

    event PriceUpdated(
        bytes32 indexed feedId,
        int192 price,
        uint32 timestamp,
        address indexed caller
    );

    error InvalidPrice(int256 price);
    error StalePrice(uint256 timestamp, uint256 currentTime);

    /**
     * @notice Constructor
     * @param _priceFeedAddress Address of the Chainlink Price Feed aggregator contract
     * @param _feedId Feed identifier (for compatibility with interface)
     * @dev For Arbitrum Sepolia ETH/USD: 0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165
     * @dev For Avalanche Fuji ETH/USD: 0x86d67c3D38D2bCeE722E601025C25a575021c6EA
     */
    constructor(address _priceFeedAddress, bytes32 _feedId) {
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        feedId = _feedId;
        feedDecimals = priceFeed.decimals();
    }

    /**
     * @notice Get the latest price from the Price Feed
     * @return price The latest price (18 decimals)
     * @return timestamp The price timestamp
     * @dev This function reads directly from the on-chain aggregator
     * @dev Chainlink Price Feeds typically use 8 decimals, we convert to 18
     */
    function getLatestPrice()
        external
        view
        override
        returns (int192 price, uint32 timestamp)
    {
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();

        // Validate price
        if (answer <= 0) {
            revert InvalidPrice(answer);
        }

        // Check for stale data (optional - can be adjusted based on requirements)
        // Uncomment if you want to enforce freshness
        // if (updatedAt < block.timestamp - 3600) { // 1 hour staleness check
        //     revert StalePrice(updatedAt, block.timestamp);
        // }

        // Convert from feed decimals to 18 decimals
        int192 scaledPrice;
        if (feedDecimals < 18) {
            scaledPrice = int192(answer * int256(10 ** (18 - feedDecimals)));
        } else if (feedDecimals > 18) {
            scaledPrice = int192(answer / int256(10 ** (feedDecimals - 18)));
        } else {
            scaledPrice = int192(answer);
        }

        return (scaledPrice, uint32(updatedAt));
    }

    /**
     * @notice Update cached price data (optional for caching purposes)
     * @return price The latest price (18 decimals)
     * @return timestamp The price timestamp
     * @dev This function is provided for interface compatibility but is optional
     * @dev With Price Feeds, you can read prices directly without caching
     */
    function updatePrice() external returns (int192 price, uint32 timestamp) {
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();

        if (answer <= 0) {
            revert InvalidPrice(answer);
        }

        // Convert from feed decimals to 18 decimals
        int192 scaledPrice;
        if (feedDecimals < 18) {
            scaledPrice = int192(answer * int256(10 ** (18 - feedDecimals)));
        } else if (feedDecimals > 18) {
            scaledPrice = int192(answer / int256(10 ** (feedDecimals - 18)));
        } else {
            scaledPrice = int192(answer);
        }

        // Cache the price
        latestPrice = PriceData({price: scaledPrice, timestamp: uint32(updatedAt)});

        emit PriceUpdated(feedId, scaledPrice, uint32(updatedAt), msg.sender);

        return (scaledPrice, uint32(updatedAt));
    }

    /**
     * @notice Get the price feed aggregator address
     * @return The address of the Chainlink Price Feed contract
     */
    function getPriceFeedAddress() external view returns (address) {
        return address(priceFeed);
    }

    /**
     * @notice Get price feed description
     * @return The description of the price feed (e.g., "ETH / USD")
     */
    function getDescription() external view returns (string memory) {
        return priceFeed.description();
    }
}
