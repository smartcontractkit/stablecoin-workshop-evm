// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IDataStreamsOracle
 * @notice Interface for the Data Streams oracle contract
 * @dev Provides read access to verified price data
 */
interface IDataStreamsOracle {
    /**
     * @notice Get the latest verified price from the oracle
     * @return price The latest price (18 decimals for crypto streams)
     * @return timestamp The observation timestamp (Unix seconds)
     * @dev Returns (0, 0) if no price has been set
     * @dev Note: Data Streams v3 crypto prices use 18 decimals
     */
    function getLatestPrice() external view returns (int192 price, uint32 timestamp);

    /**
     * @notice Get the feed ID this oracle is tracking
     * @return The Data Streams feed ID (e.g., ETH/USD)
     */
    function feedId() external view returns (bytes32);
}

