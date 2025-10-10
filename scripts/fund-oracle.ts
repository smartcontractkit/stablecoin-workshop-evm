import { ethers, network } from "hardhat";
import { getChainlinkConfig } from "./utils/config";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("💰 Funding Oracle with LINK tokens...\n");

  if (!process.env.ORACLE_CONTRACT_ADDRESS) {
    throw new Error("Missing ORACLE_CONTRACT_ADDRESS in .env file");
  }

  const chainConfig = getChainlinkConfig(network.name);
  const [signer] = await ethers.getSigners();

  console.log(`Network: ${chainConfig.name}`);
  console.log(`Oracle: ${process.env.ORACLE_CONTRACT_ADDRESS}`);
  console.log(`Funder: ${signer.address}\n`);

  // LINK token contract
  const linkToken = new ethers.Contract(
    chainConfig.linkToken,
    ["function transfer(address to, uint256 amount) external returns (bool)", "function balanceOf(address account) external view returns (uint256)"],
    signer
  );

  // Check funder's LINK balance
  const funderBalance = await linkToken.balanceOf(signer.address);
  console.log(`Your LINK balance: ${ethers.formatEther(funderBalance)} LINK`);

  if (funderBalance === 0n) {
    console.log("\n⚠️  You don't have any LINK tokens!");
    console.log(`Get testnet LINK from: https://faucets.chain.link/${network.name}`);
    process.exit(1);
  }

  // Transfer 10 LINK to oracle (adjust as needed)
  const amountToSend = ethers.parseEther("10");
  
  if (funderBalance < amountToSend) {
    console.log(`\n⚠️  Insufficient LINK. Sending all available: ${ethers.formatEther(funderBalance)} LINK`);
  }

  const actualAmount = funderBalance < amountToSend ? funderBalance : amountToSend;

  console.log(`\n📤 Transferring ${ethers.formatEther(actualAmount)} LINK to oracle...`);
  const tx = await linkToken.transfer(process.env.ORACLE_CONTRACT_ADDRESS, actualAmount);
  
  console.log(`⏳ Transaction: ${tx.hash}`);
  await tx.wait();

  // Check oracle's new balance
  const oracleBalance = await linkToken.balanceOf(process.env.ORACLE_CONTRACT_ADDRESS);
  console.log(`✅ Oracle LINK balance: ${ethers.formatEther(oracleBalance)} LINK\n`);

  console.log("🎉 Funding complete! Now run: npm run update:oracle");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Funding failed:", error.message);
    process.exit(1);
  });

