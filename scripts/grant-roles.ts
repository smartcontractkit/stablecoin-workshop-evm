import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Grant Minter and Burner Roles to TokenPool
 * 
 * This script grants the CCIP TokenPool contract the necessary permissions
 * to mint and burn tokens for cross-chain transfers.
 * 
 * Usage:
 *   npx hardhat run scripts/grant-roles.ts --network arbitrumSepolia
 *   npx hardhat run scripts/grant-roles.ts --network avalancheFuji
 * 
 * Required Environment Variables:
 *   - STABLECOIN_ADDRESS_ARBITRUM or STABLECOIN_ADDRESS_FUJI
 *   - TOKEN_POOL_ADDRESS_ARBITRUM or TOKEN_POOL_ADDRESS_FUJI
 */

async function main() {
  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "arbitrumSepolia" : network.name;

  console.log(`\n========== Grant Roles to TokenPool ==========`);
  console.log(`Network: ${networkName}`);
  console.log(`Signer: ${signer.address}`);
  console.log(`==============================================\n`);

  // Determine which addresses to use based on network
  let tokenAddress: string;
  let poolAddress: string;

  if (networkName.includes("arbitrum") || network.chainId === 421614n) {
    tokenAddress = process.env.STABLECOIN_ADDRESS_ARBITRUM || process.env.STABLECOIN_ADDRESS || "";
    poolAddress = process.env.TOKEN_POOL_ADDRESS_ARBITRUM || process.env.TOKEN_POOL_ADDRESS || "";
  } else if (networkName.includes("fuji") || networkName.includes("avalanche") || network.chainId === 43113n) {
    tokenAddress = process.env.STABLECOIN_ADDRESS_FUJI || process.env.STABLECOIN_ADDRESS || "";
    poolAddress = process.env.TOKEN_POOL_ADDRESS_FUJI || process.env.TOKEN_POOL_ADDRESS || "";
  } else {
    throw new Error(`Unsupported network: ${networkName} (chainId: ${network.chainId})`);
  }

  if (!tokenAddress) {
    throw new Error(`STABLECOIN_ADDRESS not found for ${networkName}. Please set in .env file.`);
  }

  if (!poolAddress) {
    throw new Error(`TOKEN_POOL_ADDRESS not found for ${networkName}. Please set in .env file.`);
  }

  console.log(`📄 Stablecoin Address: ${tokenAddress}`);
  console.log(`🏊 Token Pool Address: ${poolAddress}\n`);

  // Load the stablecoin contract
  const stablecoin = await ethers.getContractAt("StablecoinERC20", tokenAddress);

  // Verify owner
  const owner = await stablecoin.owner();
  console.log(`Current owner: ${owner}`);
  
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(`Signer ${signer.address} is not the owner (${owner})`);
  }

  // Check current role status
  console.log(`\n📋 Checking current role status...`);
  const isMinter = await stablecoin.isMinter(poolAddress);
  const isBurner = await stablecoin.isBurner(poolAddress);
  console.log(`  Pool is Minter: ${isMinter}`);
  console.log(`  Pool is Burner: ${isBurner}`);

  // Grant minter role if not already granted
  if (!isMinter) {
    console.log(`\n✅ Granting minter role to pool...`);
    const mintTx = await stablecoin.grantMinterRole(poolAddress);
    console.log(`  Transaction hash: ${mintTx.hash}`);
    await mintTx.wait();
    console.log(`  ✓ Minter role granted!`);
  } else {
    console.log(`\n⏭️  Pool already has minter role, skipping...`);
  }

  // Grant burner role if not already granted
  if (!isBurner) {
    console.log(`\n✅ Granting burner role to pool...`);
    const burnTx = await stablecoin.grantBurnerRole(poolAddress);
    console.log(`  Transaction hash: ${burnTx.hash}`);
    await burnTx.wait();
    console.log(`  ✓ Burner role granted!`);
  } else {
    console.log(`\n⏭️  Pool already has burner role, skipping...`);
  }

  // Final verification
  console.log(`\n📋 Final role verification:`);
  const finalIsMinter = await stablecoin.isMinter(poolAddress);
  const finalIsBurner = await stablecoin.isBurner(poolAddress);
  console.log(`  Pool is Minter: ${finalIsMinter ? "✅" : "❌"}`);
  console.log(`  Pool is Burner: ${finalIsBurner ? "✅" : "❌"}`);

  if (finalIsMinter && finalIsBurner) {
    console.log(`\n🎉 Success! TokenPool is ready for cross-chain transfers!`);
    console.log(`\n📝 Next steps:`);
    console.log(`  1. Claim admin role via: cd smart-contract-examples/ccip/cct/hardhat`);
    console.log(`  2. Link pool: npx hardhat setPool --tokenaddress ${tokenAddress} --pooladdress ${poolAddress} --network ${networkName}`);
    console.log(`  3. Configure routes: npx hardhat applyChainUpdates ...`);
  } else {
    console.log(`\n⚠️  Warning: Role assignment incomplete. Please check manually.`);
  }

  console.log(`\n==============================================\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

