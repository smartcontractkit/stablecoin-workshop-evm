import { ethers, network } from "hardhat";
import { getEnvAddress, suggestEnvVarName } from "./utils/config";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // Use the chain-agnostic getEnvAddress helper
  // This automatically checks for network-specific vars (e.g., STABLECOIN_CONTRACT_ADDRESS_FROM)
  // and falls back to generic STABLECOIN_CONTRACT_ADDRESS
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
  const balance = await stablecoin.balanceOf(signer.address);

  console.log(`\n💰 Balance on ${network.name}:`);
  console.log(`   Address: ${signer.address}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} OBSC\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

