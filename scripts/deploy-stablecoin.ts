import { ethers, network } from "hardhat";
import { getChainlinkConfig } from "./utils/config";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🪙  Deploying StablecoinERC20...\n");

  if (!process.env.ORACLE_CONTRACT_ADDRESS) {
    throw new Error("Missing ORACLE_CONTRACT_ADDRESS in .env file. Deploy oracle first!");
  }

  const chainConfig = getChainlinkConfig(network.name);
  const [deployer] = await ethers.getSigners();

  console.log(`Network: ${chainConfig.name}`);
  console.log(`Oracle: ${process.env.ORACLE_CONTRACT_ADDRESS}`);
  console.log(`Feed ID: ${chainConfig.feedId}`);
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
    process.env.ORACLE_CONTRACT_ADDRESS,  // oracle address
    chainConfig.feedId              // feed ID
  );

  await stablecoin.waitForDeployment();
  const stablecoinAddress = await stablecoin.getAddress();

  console.log(`✅ Stablecoin deployed: ${stablecoinAddress}`);
  console.log(`🔍 Explorer: ${chainConfig.explorerUrl}/address/${stablecoinAddress}\n`);

  console.log("📝 Update your .env file:");
  console.log(`STABLECOIN_CONTRACT_ADDRESS=${stablecoinAddress}\n`);

  // Verify configuration
  console.log("🔍 Verifying configuration...");
  const storedOracle = await stablecoin.oracle();
  const storedFeedId = await stablecoin.feedId();
  const symbol = await stablecoin.symbol();
  const decimals = await stablecoin.decimals();

  console.log(`Oracle: ${storedOracle} ${storedOracle === process.env.ORACLE_CONTRACT_ADDRESS ? '✅' : '❌'}`);
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

