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

