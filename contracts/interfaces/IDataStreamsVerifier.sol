// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IVerifierProxy
 * @notice Interface for Chainlink Data Streams Verifier Proxy
 * @dev Based on official Chainlink documentation
 */
interface IVerifierProxy {
    /**
     * @notice Verifies a Data Streams report
     * @param payload Full report payload (header + signed report)
     * @param parameterPayload ABI-encoded fee metadata (fee token address)
     * @return verifierResponse The verified report data
     */
    function verify(
        bytes calldata payload,
        bytes calldata parameterPayload
    ) external payable returns (bytes memory verifierResponse);

    function s_feeManager() external view returns (address);
}

/**
 * @title IFeeManager
 * @notice Interface for Chainlink Data Streams Fee Manager
 */
interface IFeeManager {
    function i_linkAddress() external view returns (address);
    function i_rewardManager() external view returns (address);
}

