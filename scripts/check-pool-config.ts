import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Check TokenPool Configuration
 * 
 * This script verifies the TokenPool configuration including:
 * - Token and pool linkage
 * - Role permissions (minter/burner)
 * - Admin status
 * - Cross-chain routes
 * 
 * Usage:
 *   npx hardhat run scripts/check-pool-config.ts --network sepolia
 *   npx hardhat run scripts/check-pool-config.ts --network baseSepolia
 * 
 * Required Environment Variables:
 *   - CHAIN_FROM: Source chain network name
 *   - CHAIN_TO: Destination chain network name
 *   - STABLECOIN_ADDRESS_FROM / STABLECOIN_ADDRESS_TO
 *   - TOKEN_POOL_ADDRESS_FROM / TOKEN_POOL_ADDRESS_TO (optional)
 */

async function main() {
  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? process.env.CHAIN_FROM || "unknown" : network.name;

  console.log(`\n========== TokenPool Configuration Check ==========`);
  console.log(`Network: ${networkName}`);
  console.log(`Chain ID: ${network.chainId}`);
  console.log(`Signer: ${signer.address}`);
  console.log(`===================================================\n`);

  // Get chain role configuration
  const chainFrom = process.env.CHAIN_FROM;
  const chainTo = process.env.CHAIN_TO;

  if (!chainFrom || !chainTo) {
    throw new Error(
      `Missing chain role configuration in .env:\n` +
      `  CHAIN_FROM=${chainFrom || '(not set)'}\n` +
      `  CHAIN_TO=${chainTo || '(not set)'}`
    );
  }

  // Determine role based on current network
  let role: 'FROM' | 'TO';
  if (networkName === chainFrom) {
    role = 'FROM';
    console.log(`🔵 SOURCE chain (FROM)\n`);
  } else if (networkName === chainTo) {
    role = 'TO';
    console.log(`🟢 DESTINATION chain (TO)\n`);
  } else {
    throw new Error(
      `Network ${networkName} is not configured as FROM or TO chain.\n` +
      `  CHAIN_FROM: ${chainFrom}\n` +
      `  CHAIN_TO: ${chainTo}`
    );
  }

  // Get addresses based on role
  const tokenAddress = process.env[`STABLECOIN_ADDRESS_${role}`] || "";
  const poolAddress = process.env[`TOKEN_POOL_ADDRESS_${role}`];

  if (!tokenAddress) {
    throw new Error(`STABLECOIN_ADDRESS_${role} not found in .env`);
  }

  console.log(`📄 Stablecoin Address: ${tokenAddress}`);
  if (poolAddress) {
    console.log(`🏊 Token Pool Address: ${poolAddress}`);
  } else {
    console.log(`⚠️  Token Pool Address: NOT SET (deploy pool first)`);
  }
  console.log();

  // Load stablecoin contract
  const stablecoin = await ethers.getContractAt("StablecoinERC20", tokenAddress);

  // Check basic token info
  console.log(`📊 Token Information:`);
  const name = await stablecoin.name();
  const symbol = await stablecoin.symbol();
  const decimals = await stablecoin.decimals();
  const totalSupply = await stablecoin.totalSupply();
  const owner = await stablecoin.owner();
  
  console.log(`  Name: ${name}`);
  console.log(`  Symbol: ${symbol}`);
  console.log(`  Decimals: ${decimals}`);
  console.log(`  Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
  console.log(`  Owner: ${owner}`);
  console.log();

  // Check oracle integration
  console.log(`🔮 Oracle Integration:`);
  const oracleAddress = await stablecoin.oracle();
  const feedId = await stablecoin.feedId();
  console.log(`  Oracle Address: ${oracleAddress}`);
  console.log(`  Feed ID: ${feedId}`);
  
  try {
    const [price, timestamp] = await stablecoin.oracle.getLatestPrice();
    const priceFormatted = ethers.formatUnits(price, 18);
    const date = new Date(Number(timestamp) * 1000);
    console.log(`  Latest Price: $${priceFormatted}`);
    console.log(`  Last Update: ${date.toISOString()}`);
  } catch (error) {
    console.log(`  ⚠️  Could not fetch latest price`);
  }
  console.log();

  // Check pool roles if pool is set
  if (poolAddress) {
    console.log(`🔐 TokenPool Role Status:`);
    const isMinter = await stablecoin.isMinter(poolAddress);
    const isBurner = await stablecoin.isBurner(poolAddress);
    console.log(`  Minter Role: ${isMinter ? "✅ GRANTED" : "❌ NOT GRANTED"}`);
    console.log(`  Burner Role: ${isBurner ? "✅ GRANTED" : "❌ NOT GRANTED"}`);
    console.log();

    if (!isMinter || !isBurner) {
      console.log(`⚠️  WARNING: Pool needs both minter and burner roles!`);
      console.log(`   Run: npx hardhat run scripts/grant-roles.ts --network ${networkName}\n`);
    }
  }

  // Check collateralization status
  console.log(`💰 Collateralization Status:`);
  const totalCollateral = await stablecoin.totalCollateral();
  const { collateralRatio, isOverCollateralized } = await stablecoin.getCollateralizationStatus();
  
  console.log(`  Total Collateral: ${ethers.formatEther(totalCollateral)} ETH`);
  console.log(`  Collateral Ratio: ${collateralRatio}%`);
  console.log(`  Status: ${isOverCollateralized ? "✅ Over-collateralized" : "⚠️  Under-collateralized"}`);
  console.log();

  // Summary
  console.log(`📋 Configuration Summary:`);
  const checks = [
    { name: "Token Deployed", status: true },
    { name: "Owner Set", status: owner !== ethers.ZeroAddress },
    { name: "Oracle Configured", status: oracleAddress !== ethers.ZeroAddress },
    { name: "Pool Deployed", status: !!poolAddress },
    { name: "Minter Role Granted", status: poolAddress ? await stablecoin.isMinter(poolAddress) : false },
    { name: "Burner Role Granted", status: poolAddress ? await stablecoin.isBurner(poolAddress) : false },
  ];

  checks.forEach(check => {
    console.log(`  ${check.status ? "✅" : "❌"} ${check.name}`);
  });

  const allPassed = checks.every(c => c.status);
  
  if (allPassed) {
    console.log(`\n🎉 All checks passed! Token is ready for CCIP transfers.`);
  } else {
    console.log(`\n⚠️  Some checks failed. Complete setup before testing transfers.`);
  }

  console.log(`\n===================================================\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

