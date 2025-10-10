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
 *   npx hardhat run scripts/grant-roles.ts --network sepolia
 *   npx hardhat run scripts/grant-roles.ts --network baseSepolia
 * 
 * Required Environment Variables:
 *   - CHAIN_FROM: Source chain network name (e.g., "sepolia")
 *   - CHAIN_TO: Destination chain network name (e.g., "baseSepolia")
 *   - STABLECOIN_CONTRACT_ADDRESS_FROM: Address on FROM chain
 *   - STABLECOIN_CONTRACT_ADDRESS_TO: Address on TO chain
 *   - TOKEN_POOL_ADDRESS_FROM: Pool on FROM chain
 *   - TOKEN_POOL_ADDRESS_TO: Pool on TO chain
 */

async function main() {
  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? process.env.CHAIN_FROM || "unknown" : network.name;

  console.log(`\n========== Grant Roles to TokenPool ==========`);
  console.log(`Network: ${networkName}`);
  console.log(`Chain ID: ${network.chainId}`);
  console.log(`Signer: ${signer.address}`);
  console.log(`==============================================\n`);

  // Get chain role configuration
  const chainFrom = process.env.CHAIN_FROM;
  const chainTo = process.env.CHAIN_TO;

  if (!chainFrom || !chainTo) {
    throw new Error(
      `Missing chain role configuration in .env:\n` +
      `  CHAIN_FROM=${chainFrom || '(not set)'}\n` +
      `  CHAIN_TO=${chainTo || '(not set)'}\n\n` +
      `Please set CHAIN_FROM and CHAIN_TO to match your network names.`
    );
  }

  // Determine role based on current network
  let role: 'FROM' | 'TO';
  if (networkName === chainFrom) {
    role = 'FROM';
    console.log(`🔵 Detected as SOURCE chain (FROM)`);
  } else if (networkName === chainTo) {
    role = 'TO';
    console.log(`🟢 Detected as DESTINATION chain (TO)`);
  } else {
    throw new Error(
      `Network ${networkName} is not configured as FROM or TO chain.\n` +
      `  CHAIN_FROM: ${chainFrom}\n` +
      `  CHAIN_TO: ${chainTo}\n` +
      `  Current network: ${networkName}\n\n` +
      `Please update your .env file or use the correct --network flag.`
    );
  }

  // Get addresses based on role
  const tokenAddress = process.env[`STABLECOIN_CONTRACT_ADDRESS_${role}`] || "";
  const poolAddress = process.env[`TOKEN_POOL_ADDRESS_${role}`] || "";

  if (!tokenAddress) {
    throw new Error(`STABLECOIN_CONTRACT_ADDRESS_${role} not found in .env file.`);
  }

  if (!poolAddress) {
    throw new Error(`TOKEN_POOL_ADDRESS_${role} not found in .env file.`);
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
    const mintTx = await stablecoin.grantMintRole(poolAddress);
    console.log(`  Transaction hash: ${mintTx.hash}`);
    await mintTx.wait();
    console.log(`  ✓ Minter role granted!`);
  } else {
    console.log(`\n⏭️  Pool already has minter role, skipping...`);
  }

  // Grant burner role if not already granted
  if (!isBurner) {
    console.log(`\n✅ Granting burner role to pool...`);
    const burnTx = await stablecoin.grantBurnRole(poolAddress);
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
    console.log(`  1. Repeat on ${role === 'FROM' ? 'TO' : 'FROM'} chain: npx hardhat run scripts/grant-roles.ts --network ${role === 'FROM' ? chainTo : chainFrom}`);
    console.log(`  2. Claim admin roles on both chains`);
    console.log(`  3. Link pools via TokenAdminRegistry`);
    console.log(`  4. Configure cross-chain routes`);
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

