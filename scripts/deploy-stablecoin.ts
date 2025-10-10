import { ethers, network } from "hardhat";
import { getChainlinkConfig, getEnvAddress, suggestEnvVarName } from "./utils/config";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🪙  Deploying StablecoinERC20...\n");

  // Try role-based first, then generic
  const oracleAddress = getEnvAddress("ORACLE_CONTRACT_ADDRESS", network.name);
  
  if (!oracleAddress) {
    const suggestedName = suggestEnvVarName("ORACLE_CONTRACT_ADDRESS", network.name);
    throw new Error(
      `Missing oracle address in .env file.\n` +
      `Expected: ${suggestedName}\n` +
      `Deploy oracle first using: npx hardhat run scripts/deploy-oracle.ts --network ${network.name}`
    );
  }

  const chainConfig = getChainlinkConfig(network.name);
  const [deployer] = await ethers.getSigners();

  console.log(`Network: ${chainConfig.name}`);
  console.log(`Oracle: ${oracleAddress}`);
  console.log(`Feed ID: ${chainConfig.feedId}`);
  
  // Show chain role if configured
  if (process.env.CHAIN_FROM && network.name === process.env.CHAIN_FROM) {
    console.log(`Role: 🔵 SOURCE (FROM)`);
  } else if (process.env.CHAIN_TO && network.name === process.env.CHAIN_TO) {
    console.log(`Role: 🟢 DESTINATION (TO)`);
  }
  
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Deploy stablecoin
  const Stablecoin = await ethers.getContractFactory("StablecoinERC20");
  console.log("⏳ Deploying stablecoin...");

  const stablecoin = await Stablecoin.deploy(
    "Oracle-Backed Stablecoin",  // name
    "OBSC",                        // symbol
    0,                              // maxSupply (0 = unlimited)
    oracleAddress,                  // oracle address
    chainConfig.feedId              // feed ID
  );

  await stablecoin.waitForDeployment();
  const stablecoinAddress = await stablecoin.getAddress();

  console.log(`✅ Stablecoin deployed: ${stablecoinAddress}`);
  console.log(`🔍 Explorer: ${chainConfig.explorerUrl}/address/${stablecoinAddress}\n`);

  // Suggest appropriate env var name
  const suggestedVarName = suggestEnvVarName("STABLECOIN_CONTRACT_ADDRESS", network.name);
  console.log("📝 Update your .env file:");
  console.log(`${suggestedVarName}=${stablecoinAddress}`);
  
  // Also show generic if using FROM/TO pattern
  if (suggestedVarName !== "STABLECOIN_CONTRACT_ADDRESS") {
    console.log(`# Or use generic: STABLECOIN_CONTRACT_ADDRESS=${stablecoinAddress}`);
  }
  console.log();

  // Verify configuration
  console.log("🔍 Verifying configuration...");
  const storedOracle = await stablecoin.oracle();
  const storedFeedId = await stablecoin.feedId();
  const symbol = await stablecoin.symbol();
  const decimals = await stablecoin.decimals();

  console.log(`Oracle: ${storedOracle} ${storedOracle === oracleAddress ? '✅' : '❌'}`);
  console.log(`Feed ID: ${storedFeedId} ${storedFeedId === chainConfig.feedId ? '✅' : '❌'}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`Decimals: ${decimals}\n`);

  console.log("🎉 Deployment complete!");
  console.log("Next step: Run 'npm run mint' to deposit ETH and mint stablecoins");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

