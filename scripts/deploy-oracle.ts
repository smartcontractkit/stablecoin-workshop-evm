import { ethers, network, run } from "hardhat";
import { getChainlinkConfig, suggestEnvVarName } from "./utils/config";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🔧 Deploying DataStreamsOracle...\n");

  // Get network-specific Chainlink config
  const chainConfig = getChainlinkConfig(network.name);

  console.log(`Network: ${chainConfig.name}`);
  console.log(`Price Feed: ${chainConfig.priceFeed}`);
  console.log(`Feed ID: ${chainConfig.feedId}`);
  
  // Show chain role if configured
  if (process.env.CHAIN_FROM && network.name === process.env.CHAIN_FROM) {
    console.log(`Role: 🔵 SOURCE (FROM)\n`);
  } else if (process.env.CHAIN_TO && network.name === process.env.CHAIN_TO) {
    console.log(`Role: 🟢 DESTINATION (TO)\n`);
  } else {
    console.log();
  }

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Deploy oracle contract
  const Oracle = await ethers.getContractFactory("DataStreamsOracle");
  console.log("⏳ Deploying contract...");

  const oracle = await Oracle.deploy(chainConfig.priceFeed, chainConfig.feedId);
  await oracle.waitForDeployment();

  const oracleAddress = await oracle.getAddress();

  console.log(`✅ Oracle deployed: ${oracleAddress}`);
  console.log(`🔍 Explorer: ${chainConfig.explorerUrl}/address/${oracleAddress}\n`);

  // Verify contract on block explorer
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("⏳ Verifying contract on block explorer...");
    try {
      await run("verify:verify", {
        address: oracleAddress,
        constructorArguments: [chainConfig.priceFeed, chainConfig.feedId],
      });
      console.log("✅ Contract verified successfully!\n");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ Contract already verified\n");
      } else {
        console.log("⚠️  Verification failed:", error.message);
        console.log("You can verify manually later using:");
        console.log(`npx hardhat verify --network ${network.name} ${oracleAddress} "${chainConfig.priceFeed}" "${chainConfig.feedId}"\n`);
      }
    }
  }

  // Suggest appropriate env var name
  const suggestedVarName = suggestEnvVarName("ORACLE_CONTRACT_ADDRESS", network.name);
  console.log("📝 Update your .env file:");
  console.log(`${suggestedVarName}=${oracleAddress}`);
  
  // Also show generic if using FROM/TO pattern
  if (suggestedVarName !== "ORACLE_CONTRACT_ADDRESS") {
    console.log(`# Or use generic: ORACLE_CONTRACT_ADDRESS=${oracleAddress}`);
  }
  console.log();

  // Verify stored feed ID
  const storedFeedId = await oracle.feedId();
  console.log(`Feed ID stored: ${storedFeedId}`);
  console.log(`Match: ${storedFeedId === chainConfig.feedId ? "✅" : "❌"}\n`);

  console.log("🎉 Deployment complete!");
  console.log("Next step: Run 'npm run deploy:stablecoin' to deploy the stablecoin contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

