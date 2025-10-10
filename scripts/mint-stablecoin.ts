import { ethers, network } from "hardhat";
import { getChainlinkConfig, getEnvAddress, suggestEnvVarName } from "./utils/config";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("💰 Minting Oracle-Backed Stablecoins...\n");

  const chainConfig = getChainlinkConfig(network.name);
  const [user] = await ethers.getSigners();

  // Read addresses with FROM/TO pattern support
  const stablecoinAddress = getEnvAddress("STABLECOIN_CONTRACT_ADDRESS", network.name);
  if (!stablecoinAddress) {
    const suggestedVar = suggestEnvVarName("STABLECOIN_CONTRACT_ADDRESS", network.name);
    throw new Error(
      `Missing stablecoin address. Set ${suggestedVar} in .env file (or generic STABLECOIN_CONTRACT_ADDRESS)`
    );
  }

  const oracleAddress = getEnvAddress("ORACLE_CONTRACT_ADDRESS", network.name);
  if (!oracleAddress) {
    const suggestedVar = suggestEnvVarName("ORACLE_CONTRACT_ADDRESS", network.name);
    throw new Error(
      `Missing oracle address. Set ${suggestedVar} in .env file (or generic ORACLE_CONTRACT_ADDRESS)`
    );
  }

  console.log(`Network: ${chainConfig.name}`);
  console.log(`Stablecoin: ${stablecoinAddress}`);
  console.log(`Oracle: ${oracleAddress}`);
  console.log(`User: ${user.address}\n`);

  // Connect to contracts
  const stablecoin = await ethers.getContractAt(
    "StablecoinERC20",
    stablecoinAddress
  );

  const oracle = await ethers.getContractAt(
    "DataStreamsOracle",
    oracleAddress
  );

  // Get current oracle price
  console.log("📊 Fetching current ETH/USD price from oracle...");
  const [oraclePrice, timestamp] = await oracle.getLatestPrice();
  const priceDollars = Number(oraclePrice) / 1e18;
  const priceDate = new Date(Number(timestamp) * 1000);

  console.log(`Price: $${priceDollars.toFixed(2)} (18 decimals)`);
  console.log(`Timestamp: ${priceDate.toISOString()}\n`);

  // Amount to deposit (default: 0.1 ETH)
  const ethAmount = ethers.parseEther(process.env.ETH_DEPOSIT_AMOUNT || "0.1");
  console.log(`📤 Depositing ${ethers.formatEther(ethAmount)} ETH...`);

  // Calculate expected stablecoin mint
  const expectedMint = (ethAmount * oraclePrice) / ethers.parseEther("1");
  console.log(`Expected mint: ~${ethers.formatEther(expectedMint)} OBSC\n`);

  // Check balance before
  const ethBalanceBefore = await ethers.provider.getBalance(user.address);
  const stablecoinBalanceBefore = await stablecoin.balanceOf(user.address);

  console.log("Before:");
  console.log(`  ETH: ${ethers.formatEther(ethBalanceBefore)}`);
  console.log(`  OBSC: ${ethers.formatEther(stablecoinBalanceBefore)}\n`);

  // Deposit and mint
  console.log("⏳ Executing depositAndMint()...");
  const tx = await stablecoin.depositAndMint({ value: ethAmount });
  console.log(`Transaction: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`✅ Confirmed (Block: ${receipt.blockNumber})\n`);

  // Check balance after
  const ethBalanceAfter = await ethers.provider.getBalance(user.address);
  const stablecoinBalanceAfter = await stablecoin.balanceOf(user.address);

  console.log("After:");
  console.log(`  ETH: ${ethers.formatEther(ethBalanceAfter)}`);
  console.log(`  OBSC: ${ethers.formatEther(stablecoinBalanceAfter)}\n`);

  // Calculate actual minted
  const actualMinted = stablecoinBalanceAfter - stablecoinBalanceBefore;
  console.log(`✨ Minted: ${ethers.formatEther(actualMinted)} OBSC`);
  console.log(`USD Value: ~$${ethers.formatEther(actualMinted)}\n`);

  // Get collateralization status
  console.log("📈 Collateralization Status:");
  const [collateralValue, supply, ratio] = await stablecoin.getCollateralizationStatus();
  console.log(`  Total Collateral Value: $${ethers.formatEther(collateralValue)}`);
  console.log(`  Total Supply: ${ethers.formatEther(supply)} OBSC`);
  console.log(`  Ratio: ${Number(ratio) / 100}%\n`);

  console.log("🎉 Minting complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Minting failed:", error);
    process.exit(1);
  });

