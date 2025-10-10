import { ethers, network } from "hardhat";
import { getChainlinkConfig } from "./utils/config";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🔧 Deploying DataStreamsOracle...\n");

  // Get network-specific Chainlink config
  const chainConfig = getChainlinkConfig(network.name);

  console.log(`Network: ${chainConfig.name}`);
  console.log(`Verifier: ${chainConfig.verifier}`);
  console.log(`Feed ID: ${chainConfig.feedId}\n`);

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Deploy oracle contract
  const Oracle = await ethers.getContractFactory("DataStreamsOracle");
  console.log("⏳ Deploying contract...");

  const oracle = await Oracle.deploy(chainConfig.verifier, chainConfig.feedId);
  await oracle.waitForDeployment();

  const oracleAddress = await oracle.getAddress();

  console.log(`✅ Oracle deployed: ${oracleAddress}`);
  console.log(`🔍 Explorer: ${chainConfig.explorerUrl}/address/${oracleAddress}\n`);

  console.log("📝 Update your .env file:");
  console.log(`ORACLE_CONTRACT_ADDRESS=${oracleAddress}\n`);

  // Verify stored feed ID
  const storedFeedId = await oracle.feedId();
  console.log(`Feed ID stored: ${storedFeedId}`);
  console.log(`Match: ${storedFeedId === chainConfig.feedId ? "✅" : "❌"}\n`);

  console.log("🎉 Deployment complete!");
  console.log("Next step: Run 'npm run update:oracle' to fetch and verify first price");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

