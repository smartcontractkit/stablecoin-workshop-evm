export const CHAINLINK_CONFIGS = {
  "arbitrum-sepolia": {
    name: "Arbitrum Sepolia",
    chainSelector: "3478487238524512106",
    ccipRouter: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
    linkToken: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E",
    verifier: "0x2ff010DEbC1297f19579B4246cad07bd24F2488A",
    feedId: "0x000359843a543ee2fe414dc14c7e7920ef10f4372990b79d6361cdc0dd1ba782",
    explorerUrl: "https://sepolia.arbiscan.io",
  },
  "avalanche-fuji": {
    name: "Avalanche Fuji",
    chainSelector: "14767482510784806043",
    ccipRouter: "0xF694E193200268f9a4868e4Aa017A0118C9a8177",
    linkToken: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
    verifier: "0x2bf612C65f5a4d388E687948bb2CF842FFb8aBB3",
    feedId: "0x000359843a543ee2fe414dc14c7e7920ef10f4372990b79d6361cdc0dd1ba782",
    explorerUrl: "https://testnet.snowtrace.io",
  },
} as const;

export type NetworkName = keyof typeof CHAINLINK_CONFIGS;

export function getChainlinkConfig(networkName: string) {
  const config = CHAINLINK_CONFIGS[networkName as NetworkName];
  if (!config) {
    throw new Error(
      `No Chainlink config for network: ${networkName}. ` +
        `Supported networks: ${Object.keys(CHAINLINK_CONFIGS).join(", ")}`
    );
  }
  return config;
}

/**
 * Helper to get environment variable with FROM/TO fallback
 * Tries role-based first (e.g., STABLECOIN_ADDRESS_FROM), then generic (e.g., STABLECOIN_ADDRESS)
 */
export function getEnvAddress(
  baseKey: string,
  networkName: string
): string | undefined {
  const chainFrom = process.env.CHAIN_FROM;
  const chainTo = process.env.CHAIN_TO;

  // Determine if current network is FROM or TO
  let role: 'FROM' | 'TO' | null = null;
  if (chainFrom && networkName === chainFrom) {
    role = 'FROM';
  } else if (chainTo && networkName === chainTo) {
    role = 'TO';
  }

  // Try role-based first, then generic
  if (role) {
    const roleBasedValue = process.env[`${baseKey}_${role}`];
    if (roleBasedValue) return roleBasedValue;
  }

  // Fallback to generic
  return process.env[baseKey];
}

/**
 * Helper to suggest environment variable names for output
 */
export function suggestEnvVarName(baseKey: string, networkName: string): string {
  const chainFrom = process.env.CHAIN_FROM;
  const chainTo = process.env.CHAIN_TO;

  if (chainFrom && networkName === chainFrom) {
    return `${baseKey}_FROM`;
  } else if (chainTo && networkName === chainTo) {
    return `${baseKey}_TO`;
  }

  // If FROM/TO not configured, suggest generic
  return baseKey;
}

