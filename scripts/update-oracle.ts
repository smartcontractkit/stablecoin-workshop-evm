import { ethers, network } from "hardhat";
import { getChainlinkConfig } from "./utils/config";
import { createClient, decodeReport } from "@chainlink/data-streams-sdk";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🔧 Updating DataStreamsOracle with latest price...\n");

  // Validate environment variables
  if (!process.env.DATASTREAMS_API_KEY || !process.env.DATASTREAMS_API_SECRET) {
    throw new Error("Missing Data Streams credentials in .env file");
  }

  if (!process.env.ORACLE_CONTRACT_ADDRESS) {
    throw new Error("Missing ORACLE_CONTRACT_ADDRESS in .env file. Deploy oracle first.");
  }

  // Get network-specific config
  const chainConfig = getChainlinkConfig(network.name);

  console.log(`Network: ${chainConfig.name}`);
  console.log(`Oracle: ${process.env.ORACLE_CONTRACT_ADDRESS}`);
  console.log(`Feed ID: ${chainConfig.feedId}\n`);

  // Initialize Data Streams client
  console.log("📡 Initializing Data Streams client...");
  const client = createClient({
    apiKey: process.env.DATASTREAMS_API_KEY!,
    userId: process.env.DATASTREAMS_API_KEY!,
    userSecret: process.env.DATASTREAMS_API_SECRET!,
    endpoint: process.env.DATASTREAMS_REST_URL || "https://api.testnet-dataengine.chain.link",
    wsEndpoint: "wss://ws.testnet-dataengine.chain.link",
  });

  // Fetch latest report
  console.log("⏳ Fetching latest ETH/USD report from Data Streams...");
  const report = await client.getLatestReport(chainConfig.feedId);

  if (!report || !report.fullReport) {
    throw new Error("Failed to fetch report from Data Streams");
  }

  console.log(`✅ Report fetched (${report.fullReport.length / 2 - 1} bytes)`);
  console.log(`Report keys: ${Object.keys(report).join(", ")}\n`);

  // Connect to oracle contract
  const [signer] = await ethers.getSigners();
  console.log(`Submitter: ${signer.address}`);

  const oracleABI = [
    "function verifyAndUpdatePrice(bytes calldata unverifiedReport) external returns (int192 price, uint32 timestamp)",
    "function getLatestPrice() external view returns (int192 price, uint32 timestamp)",
    "function feedId() external view returns (bytes32)",
  ];

  const oracle = new ethers.Contract(
    process.env.ORACLE_CONTRACT_ADDRESS,
    oracleABI,
    signer
  );

  // Submit report to oracle
  console.log("📤 Submitting report to oracle contract...");
  
  try {
    const tx = await oracle.verifyAndUpdatePrice(report.fullReport);
    console.log(`⏳ Transaction submitted: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed (Block: ${receipt.blockNumber})\n`);

    // Query and display latest price
    console.log("📊 Querying latest price...");
    const [price, timestamp] = await oracle.getLatestPrice();

  // Note: Crypto streams use 18 decimals
  const priceFormatted = Number(price) / 1e18;
  const date = new Date(Number(timestamp) * 1000);

    console.log(`Price: $${priceFormatted.toFixed(2)} (18 decimals)`);
    console.log(`Timestamp: ${date.toISOString()}`);
    console.log(`Unix: ${timestamp}\n`);

    console.log("🎉 Oracle update complete!");
  } catch (error: any) {
    console.error("\n❌ Transaction failed:");
    console.error(`Error: ${error.message}`);
    if (error.data) {
      console.error(`Data: ${error.data}`);
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Update failed:");
    
    if (error.message.includes("FeedMismatch")) {
      console.error("Feed ID mismatch. Check FEED_ID in .env matches oracle deployment.");
    } else if (error.message.includes("InvalidReportVersion")) {
      console.error("Unsupported report version. Oracle supports v3 and v4 only.");
    } else if (error.message.includes("Missing Data Streams credentials")) {
      console.error("Add DATASTREAMS_API_KEY and DATASTREAMS_API_SECRET to .env file.");
    } else {
      console.error(error.message);
    }
    
    process.exit(1);
  });

