import { ethers, network } from "hardhat";
import { getEnvAddress, suggestEnvVarName } from "./utils/config";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const contractAddress = getEnvAddress("STABLECOIN_CONTRACT_ADDRESS", network.name);
  
  if (!contractAddress) {
    const suggestedVar = suggestEnvVarName("STABLECOIN_CONTRACT_ADDRESS", network.name);
    throw new Error(
      `Missing stablecoin contract address for network: ${network.name}\n` +
      `Set ${suggestedVar} in .env file (or generic STABLECOIN_CONTRACT_ADDRESS)`
    );
  }

  const stablecoin = await ethers.getContractAt("StablecoinERC20", contractAddress);
  const [signer] = await ethers.getSigners();

  console.log(`\n📊 Collateralization Status on ${network.name}:`);
  console.log(`   Contract: ${contractAddress}`);
  console.log(`   Querying as: ${signer.address}\n`);

  // Get collateralization status
  const [collateralValue, stablecoinSupply, collateralizationRatio] = await stablecoin.getCollateralizationStatus();

  console.log(`💰 Total Collateral Value: $${ethers.formatEther(collateralValue)} USD`);
  console.log(`🪙  Total Supply: ${ethers.formatEther(stablecoinSupply)} OBSC`);
  console.log(`📈 Collateral Ratio: ${Number(collateralizationRatio) / 100}%\n`);

  // Determine status
  if (collateralizationRatio >= 10000n) {
    console.log(`✅ Status: Healthy (≥100% collateralized)`);
  } else if (collateralizationRatio >= 5000n) {
    console.log(`⚠️  Status: Warning (50-100% collateralized)`);
  } else {
    console.log(`❌ Status: Critical (<50% collateralized)`);
  }
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

