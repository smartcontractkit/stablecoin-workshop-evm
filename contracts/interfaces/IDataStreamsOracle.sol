// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IDataStreamsOracle
 * @notice Interface for the Price Feed oracle contract
 * @dev Provides read access to Chainlink Price Feed data
 */
interface IDataStreamsOracle {
    /**
     * @notice Get the latest price from the oracle
     * @return price The latest price (18 decimals)
     * @return timestamp The price update timestamp (Unix seconds)
     * @dev Prices are automatically updated by Chainlink DON
     * @dev Price feeds are converted to 18 decimals for consistency
     */
    function getLatestPrice() external view returns (int192 price, uint32 timestamp);

    /**
     * @notice Get the feed ID this oracle is tracking
     * @return The feed identifier (e.g., ETH/USD identifier)
     */
    function feedId() external view returns (bytes32);
}

