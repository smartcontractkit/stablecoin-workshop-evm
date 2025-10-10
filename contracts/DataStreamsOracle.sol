// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IVerifierProxy, IFeeManager} from "./interfaces/IDataStreamsVerifier.sol";
import {IDataStreamsOracle} from "./interfaces/IDataStreamsOracle.sol";

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title DataStreamsOracle
 * @notice Simplified Data Streams Oracle for workshop purposes
 * @dev This is a minimal implementation for educational use. For production, refer to
 *      DataStreamsFeed.sol which includes:
 *      - Historical round tracking
 *      - Access control (ADMIN, REPORT_VERIFIER roles)
 *      - Expiration enforcement
 *      - Pre/post update hooks
 *      - Pause functionality
 * 
 * This contract demonstrates core Data Streams integration:
 * 1. On-chain verification via Chainlink Verifier
 * 2. Price extraction and storage
 * 3. Public price query interface
 */
contract DataStreamsOracle is IDataStreamsOracle {
    struct PriceData {
        int192 price;        // Price with 18 decimals (for crypto streams)
        uint32 timestamp;    // Unix timestamp
    }

    bytes32 public immutable override feedId;
    IVerifierProxy public immutable verifierProxy;
    PriceData public latestPrice;

    event PriceUpdated(
        bytes32 indexed feedId,
        int192 price,
        uint32 timestamp,
        address indexed updater
    );

    error FeedMismatch(bytes32 expected, bytes32 actual);
    error InvalidReportVersion(uint16 version);

    constructor(address _verifierProxy, bytes32 _feedId) {
        verifierProxy = IVerifierProxy(_verifierProxy);
        feedId = _feedId;
    }

    /**
     * @notice Verify and update price from Data Streams report
     * @param unverifiedReport Raw report bytes from Data Streams API
     * @return price The verified price (18 decimals for crypto streams)
     * @return timestamp The observation timestamp
     * @dev Report structure (v3):
     *      - bytes32: feedId
     *      - uint32: validFromTimestamp
     *      - uint32: observationsTimestamp
     *      - uint192: nativeFee
     *      - uint192: linkFee
     *      - uint32: expiresAt
     *      - int192: price (18 decimals for crypto)
     *      - int192: bid
     *      - int192: ask
     */
    function verifyAndUpdatePrice(
        bytes calldata unverifiedReport
    ) external returns (int192 price, uint32 timestamp) {
        // Decode the report to extract reportData
        (, bytes memory reportData) = abi.decode(
            unverifiedReport,
            (bytes32[3], bytes)
        );

        // Extract report version (first 2 bytes of reportData)
        uint16 reportVersion = (uint16(uint8(reportData[0])) << 8) |
            uint16(uint8(reportData[1]));

        if (reportVersion != 3) {
            revert InvalidReportVersion(reportVersion);
        }

        // Handle FeeManager (if exists on this chain)
        address feeManagerAddr = verifierProxy.s_feeManager();
        bytes memory parameterPayload;

        if (feeManagerAddr != address(0)) {
            // FeeManager exists - need to handle LINK token approval
            // For workshop: Assumes contract has LINK tokens
            IFeeManager feeManager = IFeeManager(feeManagerAddr);
            address linkToken = feeManager.i_linkAddress();
            address rewardManager = feeManager.i_rewardManager();
            
            // Approve max LINK to reward manager (simplified for workshop)
            IERC20(linkToken).approve(rewardManager, type(uint256).max);
            
            parameterPayload = abi.encode(linkToken);
        } else {
            // No FeeManager on this chain
            parameterPayload = bytes("");
        }

        // Call Chainlink Verifier Proxy
        bytes memory verifiedReportData = verifierProxy.verify(
            unverifiedReport,
            parameterPayload
        );

        // Decode V3 report structure (matches Chainlink's ReportV3 struct exactly)
        (
            bytes32 reportFeedId,
            ,  // validFromTimestamp
            uint32 reportTimestamp,  // observationsTimestamp
            ,  // nativeFee
            ,  // linkFee
            ,  // expiresAt
            int192 reportPrice,  // price
            ,  // bid
               // ask
        ) = abi.decode(
            verifiedReportData,
            (bytes32, uint32, uint32, uint192, uint192, uint32, int192, int192, int192)
        );

        // Validate feed ID matches
        if (reportFeedId != feedId) {
            revert FeedMismatch(feedId, reportFeedId);
        }

        // Store latest price
        latestPrice = PriceData({price: reportPrice, timestamp: reportTimestamp});

        emit PriceUpdated(feedId, reportPrice, reportTimestamp, msg.sender);

        return (reportPrice, reportTimestamp);
    }

    /**
     * @notice Get the latest verified price
     * @return price The latest price (18 decimals for crypto streams)
     * @return timestamp The observation timestamp
     * @dev Returns (0, 0) if no price has been set
     * @dev No expiration check (simplified for workshop)
     * @dev Crypto streams use 18 decimals, RWA streams may use 8 decimals
     */
    function getLatestPrice()
        external
        view
        override
        returns (int192 price, uint32 timestamp)
    {
        return (latestPrice.price, latestPrice.timestamp);
    }
}

