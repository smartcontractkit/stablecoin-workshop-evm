# Chainlink Oracle-Backed Cross-Chain Stablecoin Workshop
## EVM → EVM Implementation Guide

This workshop guides you through building a production-ready oracle-backed stablecoin system with Chainlink CCIP cross-chain integration, enabling seamless token transfers between any two EVM chains.

## 🎯 System Overview

**What We're Building:**
- **Oracle-backed stablecoin** using Chainlink Data Streams (ETH/USD price feeds)
- **Cross-chain token transfers** via Chainlink CCIP (EVM ↔ EVM)
- **Chain-agnostic architecture** - works with any supported EVM chain pair
- **Real-time price verification** and on-chain storage

**Key Components:**
1. **DataStreamsOracle** - Verifies and stores Chainlink Data Streams reports on-chain
2. **StablecoinERC20** - Mints tokens based on ETH collateral using oracle price data
3. **CCIP TokenPools** - Enable cross-chain Burn & Mint transfers
4. **TokenAdminRegistry** - Manages pool registration and cross-chain routing

---

## 📌 About This Workshop

This workshop uses **Arbitrum Sepolia → Avalanche Fuji** as a working example, but the architecture is **fully chain-agnostic**. 

**You can deploy to any EVM chain pair** that supports:
- ✅ Chainlink CCIP
- ✅ Chainlink Data Streams

**All commands in this guide use Arbitrum Sepolia and Avalanche Fuji as examples.** Simply replace these network names with your chosen chains throughout the workshop.

**Using different chains?** See [Adapting to Other Chain Pairs](#-adapting-to-other-chain-pairs) at the end for configuration details.

---

## 📋 Prerequisites

### Required Tools

**Node.js (v18+) and npm**
- Download from: https://nodejs.org/
- Or use package manager: `brew install node` (macOS) / `apt install nodejs npm` (Ubuntu)

**Git**
- Install via your system package manager or https://git-scm.com/downloads

### Operating System Compatibility

**✅ macOS / Linux**
- Full support out of the box
- All commands work as documented

**✅ Windows**
- Supported with Git symlink configuration
- **Important:** This workshop uses Git symlinks for `.env` file sharing between root and submodule directories

**Windows Setup (Required):**

This workshop relies on a symlink from `smart-contract-examples/ccip/cct/hardhat/.env` → `../../../../.env`. To enable symlinks on Windows:

**Option 1: Enable Developer Mode (Recommended)**
1. Open Settings → Update & Security → For developers
2. Enable "Developer Mode"
3. Configure Git: `git config --global core.symlinks true`
4. Clone the repository (symlinks will work automatically)

**Option 2: Run Git as Administrator**
1. Configure Git: `git config --global core.symlinks true`
2. Clone the repository using Git Bash **run as Administrator**

**Option 3: Manual Workaround (If symlinks don't work)**
If symlinks fail to work, manually copy `.env` after each update:
```bash
# After updating root .env, copy to submodule:
cp .env smart-contract-examples/ccip/cct/hardhat/.env
```

**Verify Symlink:**
After cloning, check if the symlink works:
```bash
# On Windows (PowerShell):
Get-Item smart-contract-examples/ccip/cct/hardhat/.env | Select-Object LinkType, Target

# On Windows (Git Bash) or macOS/Linux:
ls -la smart-contract-examples/ccip/cct/hardhat/.env
```

You should see a symlink pointing to `../../../../.env`.

### Required Accounts & Access

**Testnet Funds:**
- **Wallet with testnet ETH** on both your chosen chains
- **LINK tokens** for CCIP fees on both chains
- **Ask instructor for testnet funds** (recommended - fastest)

**Example Faucets (for Arbitrum Sepolia & Avalanche Fuji):**
- Arbitrum Sepolia: https://faucets.chain.link/arbitrum-sepolia
- Avalanche Fuji: https://core.app/tools/testnet-faucet/

**For other chains:** Visit https://faucets.chain.link/ and select your networks

**Chainlink Data Streams Access:**
- API Key and Secret (provided in workshop)

---

## 🔧 Environment Setup (Required Before Phase 1)

### Step 0.1: Clone the Workshop Repository
```bash
# Clone the repository
git clone https://github.com/smartcontractkit/stablecoin-workshop-evm

# Navigate into the project directory
cd stablecoin-workshop-evm
```

### Step 0.2: Initialize Git Submodules
```bash
# Initialize CCIP submodule (required for cross-chain integration)
# ⚠️ WARNING: This can take 5+ minutes depending on your environment
git submodule update --init --recursive
```

**📦 Submodule Information:**
The repository contains the `smart-contract-examples/` submodule with Chainlink's official CCIP Hardhat contracts and deployment tasks.

### Step 0.3: Install Dependencies
```bash
# Install Node.js dependencies
npm install
```

### Step 0.4: Setup Environment File
```bash
# Copy the example file to create your .env
cp .env.example .env
```

### Step 0.5: Configure Your Environment

Edit the `.env` file and fill in these **required** values:

```bash
vim .env
# Or use nano if you prefer: nano .env
```

**📝 Vim Quick Reference:** `i` to edit, `Esc` then `:wq` to save and quit

**🔑 Required Configuration (Fill These Before Starting):**

```bash
# Step 1: Choose Your Chain Pair (REQUIRED - must be set)
# Example below uses Arbitrum Sepolia → Avalanche Fuji
# Replace with any supported EVM chain pair (see .env.example for pre-configured options)
CHAIN_FROM=arbitrum-sepolia
CHAIN_TO=avalanche-fuji

# Step 2: Private Key & API Credentials (REQUIRED - add your credentials)
PRIVATE_KEY=your_private_key_without_0x_prefix
DATASTREAMS_API_KEY=your_chainlink_api_key
DATASTREAMS_API_SECRET=your_chainlink_api_secret
```

**💡 Important:** Both `CHAIN_FROM`/`CHAIN_TO` AND your credentials must be set for the workshop to work.

**⚠️ Special Characters in API Secrets:**

If your `DATASTREAMS_API_SECRET` contains special characters (like `&`, `<`, `>`, `*`, etc.), make sure it's properly quoted:

```bash
# ✅ Correct - quoted secret
DATASTREAMS_API_SECRET="your-secret-with-special&characters<here>"

# ❌ Wrong - unquoted secret (will cause parsing errors with source .env)
DATASTREAMS_API_SECRET=your-secret-with-special&characters<here>
```

**📝 Note:** After editing `.env`, simply run `source .env` to reload all variables. The shell and Node.js automatically strip quotes when loading variables, so both our scripts (`dotenv`) and the CCIP submodule will receive clean values.

**✅ Pre-configured Values (Already Set in .env.example):**
- `DATASTREAMS_REST_URL` and `DATASTREAMS_WS_URL` (testnet endpoints)
- Default RPC URLs for both chains

**🔄 Values to Fill During Deployment:**
- `ORACLE_CONTRACT_ADDRESS_FROM` and `ORACLE_CONTRACT_ADDRESS_TO`
- `STABLECOIN_CONTRACT_ADDRESS_FROM` and `STABLECOIN_CONTRACT_ADDRESS_TO`
- `TOKEN_POOL_ADDRESS_FROM` and `TOKEN_POOL_ADDRESS_TO`

### Step 0.6: Verify Setup
```bash
# Compile contracts to verify setup
npx hardhat compile
```

**Expected Output:**
```
Compiled 15 Solidity files successfully
```

---

## 🏗️ Phase 1: Oracle & Stablecoin on FROM Chain

**💡 Example Chain:** Commands in this phase use `arbitrum-sepolia`. Replace with your FROM chain.

### Step 1.1: Deploy Oracle
```bash
npx hardhat run scripts/deploy-oracle.ts --network arbitrum-sepolia
```

**Expected Output:**
```
✅ Oracle deployed: 0x[your-oracle-address]
🔍 Explorer: https://sepolia.arbiscan.io/address/0x[your-oracle-address]

📝 Update your .env file:
ORACLE_CONTRACT_ADDRESS_FROM=0x[your-oracle-address]
```

**Key Address to Save:**
- **Oracle Address (FROM):** Copy the address from output

### Step 1.2: Update Environment with Oracle Address
```bash
vim .env
# Find: ORACLE_CONTRACT_ADDRESS_FROM=
# Add your oracle address from Step 1.1
```

### Step 1.3: Fund Oracle with LINK
```bash
npx hardhat run scripts/fund-oracle.ts --network arbitrum-sepolia
```

**💡 Important:** The oracle needs LINK tokens to pay for Data Streams verification fees. Make sure your wallet has LINK on Arbitrum Sepolia.

### Step 1.4: Update Oracle with Live ETH/USD Price
```bash
npx hardhat run scripts/update-oracle.ts --network arbitrum-sepolia
```

**Expected Output:**
```
✅ Transaction confirmed
📊 Querying latest price...
Price: $4013.88 (18 decimals)
Timestamp: 2025-10-10T20:35:25.000Z
```

### Step 1.5: Deploy Stablecoin
```bash
npx hardhat run scripts/deploy-stablecoin.ts --network arbitrum-sepolia
```

**Expected Output:**
```
✅ Stablecoin deployed: 0x[your-stablecoin-address]
🔍 Explorer: https://sepolia.arbiscan.io/address/0x[your-stablecoin-address]

📝 Update your .env file:
STABLECOIN_CONTRACT_ADDRESS_FROM=0x[your-stablecoin-address]
```

**Key Address to Save:**
- **Stablecoin Address (FROM):** Copy the address from output

### Step 1.6: Update Environment with Stablecoin Address
```bash
vim .env
# Find: STABLECOIN_CONTRACT_ADDRESS_FROM=
# Add your stablecoin address from Step 1.5
```

### Step 1.7: Test Collateral-Backed Minting
```bash
npx hardhat run scripts/mint-stablecoin.ts --network arbitrum-sepolia
```

**Expected Output:**
```
📊 Fetching current ETH/USD price from oracle...
Price: $4013.88 (18 decimals)

📤 Depositing 0.1 ETH...
Expected mint: ~401.388 OBSC

✨ Minted: 401.388 OBSC
📈 Collateralization Status:
  Total Collateral Value: $401.388
  Total Supply: 401.388 OBSC
  Ratio: 100%

🎉 Minting complete!
```

**✅ Checkpoint:** You now have a working oracle-backed stablecoin on your FROM chain with real Chainlink Data Streams price feeds!

---

## 🏗️ Phase 2: Oracle & Stablecoin on TO Chain

**💡 Example Chain:** Commands in this phase use `avalanche-fuji`. Replace with your TO chain.

**💡 Note:** While the TO chain (destination) also gets an oracle in this workshop for consistency, in production scenarios, a destination-only chain doesn't strictly require oracle integration since it only receives tokens via CCIP, not collateral-based minting. However, deploying it allows testing minting on both chains.

**📝 Quick Reference:** This phase repeats the same workflow as Phase 1, but on the TO chain. See Phase 1 for detailed explanations of each step.

### Step 2.1: Deploy & Configure Oracle on TO Chain
```bash
# Deploy Oracle
npx hardhat run scripts/deploy-oracle.ts --network avalanche-fuji

# Update .env with ORACLE_CONTRACT_ADDRESS_TO from output
vim .env

# Reload environment
source .env

# Fund Oracle with LINK (ensure your wallet has LINK on TO chain)
npx hardhat run scripts/fund-oracle.ts --network avalanche-fuji

# Update Oracle with live price
npx hardhat run scripts/update-oracle.ts --network avalanche-fuji
```

**Expected Output (update-oracle):**
```
✅ Transaction confirmed
📊 Querying latest price...
Price: $3750.17 (18 decimals)
```

### Step 2.2: Deploy Stablecoin on TO Chain
```bash
# Deploy Stablecoin
npx hardhat run scripts/deploy-stablecoin.ts --network avalanche-fuji

# Update .env with STABLECOIN_CONTRACT_ADDRESS_TO from output
vim .env

# Reload environment
source .env
```

### Step 2.3: Test Minting on TO Chain (Optional)
```bash
npx hardhat run scripts/mint-stablecoin.ts --network avalanche-fuji
```

**✅ Checkpoint:** You now have oracle-backed stablecoins deployed on both chains!

---

## 🌉 Phase 3: CCIP TokenPool Deployment

**💡 Network Names:** CCIP submodule uses camelCase (e.g., `arbitrumSepolia`, `avalancheFuji`). Our custom scripts use kebab-case (e.g., `arbitrum-sepolia`). Both refer to the same networks.

### Step 3.1: Navigate to CCIP Submodule
```bash
cd smart-contract-examples/ccip/cct/hardhat
```

### Step 3.2: Setup Environment for CCIP Scripts
```bash
# Enable child processes to pick up environment variables within Hardhat
set -a

# Load environment variables from .env (symlinked)
source .env
```

**💡 What This Does:**
- Loads all required environment variables from your `.env` file
- The CCIP submodule Hardhat tasks can now access `$PRIVATE_KEY`, RPC URLs, and all deployed contract addresses

### Step 3.3: Deploy TokenPool on FROM Chain
```bash
# Deploy TokenPool (using $STABLECOIN_CONTRACT_ADDRESS_FROM from sourced .env)
npx hardhat deployTokenPool \
  --network arbitrumSepolia \
  --tokenaddress $STABLECOIN_CONTRACT_ADDRESS_FROM \
  --pooltype burnMint
```

**Expected Output:**
```
Token pool deployed to: 0x[your-pool-address]
Granting mint and burn roles to 0x[your-pool-address]...
Token pool contract deployed successfully
```

**✨ What Happened:**
- TokenPool was deployed successfully
- The deployment script automatically granted mint and burn roles to the pool
- Our `StablecoinERC20` contract has a `grantMintAndBurnRoles()` wrapper that enables this seamless integration

**Key Address to Save:**
- **TokenPool Address (FROM):** Copy the pool address from output

### Step 3.4: Update Environment with FROM Chain Pool
```bash
vim .env
# Find: TOKEN_POOL_ADDRESS_FROM=
# Add your pool address from Step 3.3
```

### Step 3.5: Deploy TokenPool on TO Chain
```bash

# Deploy TokenPool on TO chain
npx hardhat deployTokenPool \
  --network avalancheFuji \
  --tokenaddress $STABLECOIN_CONTRACT_ADDRESS_TO \
  --pooltype burnMint
```

**Expected Output:**
```
Token pool deployed to: 0x[your-pool-address]
Granting mint and burn roles to 0x[your-pool-address]...
Token pool contract deployed successfully
```

### Step 3.6: Update Environment with TO Chain Pool
```bash
vim .env
# Find: TOKEN_POOL_ADDRESS_TO=
# Add your pool address from Step 3.5
```

**✅ Checkpoint:** Both TokenPools are deployed with proper mint/burn permissions!

---

## 🔗 Phase 4: CCIP Registration & Configuration

### Step 4.1: Setup Environment Variables
```bash
# Load all environment variables (symlinked)
source .env

# Verify all contract addresses are loaded correctly
echo "FROM Stablecoin: $STABLECOIN_CONTRACT_ADDRESS_FROM"
echo "FROM Pool: $TOKEN_POOL_ADDRESS_FROM"
echo "TO Stablecoin: $STABLECOIN_CONTRACT_ADDRESS_TO"
echo "TO Pool: $TOKEN_POOL_ADDRESS_TO"
```

### Step 4.2: Claim Admin on FROM Chain
```bash
npx hardhat claimAdmin \
  --network arbitrumSepolia \
  --tokenaddress $STABLECOIN_CONTRACT_ADDRESS_FROM \
  --mode owner
```

**Expected Output:**
```
✅ Successfully claimed admin using owner mode
```

### Step 4.3: Claim Admin on TO Chain
```bash
npx hardhat claimAdmin \
  --network avalancheFuji \
  --tokenaddress $STABLECOIN_CONTRACT_ADDRESS_TO \
  --mode owner
```

**Expected Output:**
```
✅ Successfully claimed admin using owner mode
```

### Step 4.4: Accept Admin Role on FROM Chain
```bash
npx hardhat acceptAdminRole \
  --network arbitrumSepolia \
  --tokenaddress $STABLECOIN_CONTRACT_ADDRESS_FROM
```

**Expected Output:**
```
Accepted admin role for token [...] tx: 0x[...]
```

### Step 4.5: Accept Admin Role on TO Chain
```bash
npx hardhat acceptAdminRole \
  --network avalancheFuji \
  --tokenaddress $STABLECOIN_CONTRACT_ADDRESS_TO
```

**Expected Output:**
```
Accepted admin role for token [...] tx: 0x[...]
```

### Step 4.6: Set Pool on FROM Chain
```bash
npx hardhat setPool \
  --network arbitrumSepolia \
  --tokenaddress $STABLECOIN_CONTRACT_ADDRESS_FROM \
  --pooladdress $TOKEN_POOL_ADDRESS_FROM
```

**Expected Output:**
```
Pool set for token [...] to [...]
```

### Step 4.7: Set Pool on TO Chain
```bash
npx hardhat setPool \
  --network avalancheFuji \
  --tokenaddress $STABLECOIN_CONTRACT_ADDRESS_TO \
  --pooladdress $TOKEN_POOL_ADDRESS_TO
```

**Expected Output:**
```
Pool set for token [...] to [...]
```

### Step 4.8: Configure FROM → TO Route
```bash
npx hardhat applyChainUpdates \
  --network arbitrumSepolia \
  --pooladdress $TOKEN_POOL_ADDRESS_FROM \
  --remotechain avalancheFuji \
  --remotepooladdresses $TOKEN_POOL_ADDRESS_TO \
  --remotetokenaddress $STABLECOIN_CONTRACT_ADDRESS_TO
```

**Expected Output:**
```
✅ Chain update applied successfully!
```

### Step 4.9: Configure TO → FROM Route
```bash
npx hardhat applyChainUpdates \
  --network avalancheFuji \
  --pooladdress $TOKEN_POOL_ADDRESS_TO \
  --remotechain arbitrumSepolia \
  --remotepooladdresses $TOKEN_POOL_ADDRESS_FROM \
  --remotetokenaddress $STABLECOIN_CONTRACT_ADDRESS_FROM
```

**Expected Output:**
```
✅ Chain update applied successfully!
```

**✅ Checkpoint:** CCIP is fully configured for bidirectional cross-chain transfers!

---

## 🚀 Phase 5: Execute Cross-Chain Transfer

**💡 Transfer Direction:** This phase demonstrates TO → FROM transfer (reverse direction) to showcase bidirectional capability.

### Step 5.1a: Return to Project Root
```bash
cd ../../../../
```

### Step 5.1b: Load Environment Variables
```bash
source .env
```

### Step 5.1c: Check Balance on TO Chain
```bash
npx hardhat run scripts/check-balance.ts --network avalanche-fuji
```

**Expected Output:**
```
💰 Balance on avalanche-fuji:
   Address: 0x4fed0A5B65eac383D36E65733786386709B86be8
   Balance: 385.91 OBSC
```

**💡 Note:** We're checking the TO chain (destination) balance here because in this workshop example, we minted tokens on BOTH chains during Phase 1 and 2. For a real-world scenario where tokens only exist on FROM chain initially, this balance would be 0.

### Step 5.2a: Navigate to CCIP Submodule
```bash
cd smart-contract-examples/ccip/cct/hardhat
```

### Step 5.2b: Load Environment Variables
```bash
source .env
```

### Step 5.2c: Execute Cross-Chain Transfer
```bash
# Transfer tokens from TO chain to FROM chain
# Replace <YOUR_WALLET_ADDRESS> with your actual wallet address (same address as your PRIVATE_KEY)
npx hardhat transferTokens \
  --tokenaddress $STABLECOIN_CONTRACT_ADDRESS_TO \
  --amount 10000000000000000000 \
  --destinationchain arbitrumSepolia \
  --receiveraddress <YOUR_WALLET_ADDRESS> \
  --fee LINK \
  --network avalancheFuji
```

**💡 Getting Your Wallet Address:**
- If you don't know your wallet address, you can find it in MetaMask or any wallet app
- It's the same address that corresponds to your `PRIVATE_KEY` in `.env`
- Format: `0x1234...abcd` (42 characters starting with 0x)

**💡 Amount Format:** The amount is in wei (18 decimals). To transfer 10 tokens, use `10000000000000000000`.

**💡 Network Names:** Replace `avalancheFuji` with your TO chain (camelCase) and `arbitrumSepolia` with your FROM chain.

**Expected Output:**
```
Estimated fees: [fee-amount]
Approving tokens...
Transferring tokens...
Transaction hash: 0x[transaction-hash]
Check status: https://ccip.chain.link/tx/0x[transaction-hash]
```

### Step 5.3: Monitor Transfer
- **CCIP Explorer:** Copy the URL from the output to track your transfer
- **Expected Time:** 10-20 minutes for cross-chain confirmation
- **On Success:** Tokens will be burned on TO chain and minted on FROM chain

### Step 5.4: Verify Receipt (After 10-20 minutes)
```bash
# Return to project root
cd ../../../../

# Load environment variables
source .env

# Check balance on destination chain (FROM chain)
npx hardhat run scripts/check-balance.ts --network arbitrum-sepolia
```

**Expected Output:**
```
💰 Balance on arbitrum-sepolia:
   Address: 0x4fed0A5B65eac383D36E65733786386709B86be8
   Balance: 10.0 OBSC

✅ Tokens successfully received from TO chain!
```

**✅ Success!** You've completed a cross-chain transfer of oracle-backed stablecoins!

---

## 🧪 Verification Commands (Optional)

### Check Oracle Price
```bash
npx hardhat run scripts/update-oracle.ts --network arbitrum-sepolia
```

### Check Collateralization Status
```bash
npx hardhat run scripts/check-collateralization.ts --network arbitrum-sepolia
```

**Expected Output:**
```
📊 Collateralization Status on arbitrum-sepolia:
   Contract: 0x3eefdeF760fd03F67C17Ba8839514415f04c476b

💰 Total Collateral Value: $412.56 USD
🪙  Total Supply: 422.56 OBSC
📈 Collateral Ratio: 97.63%

⚠️  Status: Warning (50-100% collateralized)
```

---

## 🔄 Adapting to Other Chain Pairs

This workshop is chain-agnostic! To use different EVM chains:

### Step A: Update Configuration Files

**1. Edit `.env`:**
```bash
vim .env
# Change these lines:
CHAIN_FROM=your-source-chain
CHAIN_TO=your-destination-chain
```

**2. Add Chain to `hardhat.config.ts`:**
```typescript
networks: {
  "your-chain-name": {
    url: process.env.YOUR_CHAIN_RPC_URL || "https://rpc.example.com",
    chainId: 12345,
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  }
}
```

**3. Add Chainlink Addresses to `scripts/utils/config.ts`:**
```typescript
"your-chain-name": {
  name: "Your Chain Name",
  chainSelector: "chain-selector-id",
  ccipRouter: "0x...",
  linkToken: "0x...",
  verifier: "0x...",
  feedId: "0x...",
  explorerUrl: "https://explorer.example.com"
}
```

**4. Get Chainlink Addresses:**
- Chain Selector: https://docs.chain.link/ccip/directory/testnet/chain/your-chain
- Router: https://docs.chain.link/ccip/directory/testnet/chain/your-chain
- LINK Token: https://docs.chain.link/resources/link-token-contracts
- Verifier: https://docs.chain.link/data-streams/stream-ids
- Feed ID: https://docs.chain.link/data-streams/crypto-streams

### Step B: Follow Same Deployment Steps

Use the exact same commands from Phases 1-5, just replace network names:
```bash
--network arbitrum-sepolia  →  --network your-source-chain
--network avalanche-fuji    →  --network your-destination-chain
```

**Supported Chains (Examples):**
- Ethereum Sepolia
- Base Sepolia
- Polygon Amoy
- Optimism Sepolia
- Any EVM chain with CCIP support

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. "Insufficient LINK for fees"
**Solution:** Get LINK tokens from faucet
```bash
# Visit: https://faucets.chain.link/
# Select your chain and request LINK
```

#### 2. "execution reverted" During Oracle Update
**Problem:** Oracle doesn't have enough LINK for verification fees
**Solution:** Fund the oracle
```bash
npx hardhat run scripts/fund-oracle.ts --network [your-network]
```

#### 3. "Network doesn't exist" in CCIP Submodule
**Problem:** CCIP submodule uses camelCase network names
**Solution:** Use correct network names
```bash
# ❌ Wrong: arbitrum-sepolia
# ✅ Correct: arbitrumSepolia

# ❌ Wrong: avalanche-fuji  
# ✅ Correct: avalancheFuji
```

#### 4. Pool Doesn't Have Mint/Burn Roles
**Problem:** This should not happen if TokenPool was deployed successfully
**Check:** Verify roles were granted during deployment
```bash
npx hardhat console --network [your-network]
# In console:
const stablecoin = await ethers.getContractAt("StablecoinERC20", "[stablecoin-address]");
console.log("Is Minter:", await stablecoin.isMinter("[pool-address]"));
console.log("Is Burner:", await stablecoin.isBurner("[pool-address]"));
```
**Solution:** If roles are missing, manually grant them
```bash
npx hardhat console --network [your-network]
# In console:
const stablecoin = await ethers.getContractAt("StablecoinERC20", "[stablecoin-address]");
await stablecoin.grantMintAndBurnRoles("[pool-address]");
```

#### 5. "Blockhash not found" or RPC Errors
**Problem:** Temporary network congestion
**Solution:** Wait a few seconds and retry the command

#### 6. Transfer Shows Wrong Receiver Address
**Solution:** Ensure you're using `--receiveraddress` parameter
```bash
# ✅ Correct
npx hardhat transferTokens --receiveraddress 0x[your-address] ...
```

#### 7. Price Seems Too Large
**Problem:** Crypto prices use 18 decimals, not 8
**Solution:** This is correct - divide by 1e18
```
Raw price: 4013880000000000000000
Actual price: $4,013.88
```

#### 8. Transaction Fails with "insufficient funds"
**Solution:** Get more testnet ETH from faucet for your chain
```bash
# Visit: https://faucets.chain.link/
# Select your chain and request testnet ETH
```

#### 9. Environment Variables Not Loading
**Solution:** Reload your environment
```bash
# From project root:
source .env

# Or from CCIP submodule directory:
source .env
```

**💡 Note:** After running `source .env`, all variables (including `PRIVATE_KEY`, `DATASTREAMS_API_SECRET`, and all contract addresses) are automatically available in your shell.

#### 10. "Cannot find module" Errors
**Solution:** Reinstall dependencies
```bash
npm install
cd smart-contract-examples/ccip/cct/hardhat
npm install
```

---

## 📚 Additional Resources

### Chainlink Documentation
- **Data Streams:** https://docs.chain.link/data-streams
- **CCIP:** https://docs.chain.link/ccip
- **Price Feeds:** https://docs.chain.link/data-feeds

### Explorers
- **CCIP Explorer:** https://ccip.chain.link/
- **Find your chain's explorer:** Check your chain's documentation or https://chainlist.org/

**Example Chain Explorers:**
- Arbitrum Sepolia: https://sepolia.arbiscan.io/
- Avalanche Fuji: https://testnet.snowtrace.io/
- Ethereum Sepolia: https://sepolia.etherscan.io/
- Base Sepolia: https://sepolia.basescan.org/

---

## 🎉 Congratulations!

You've successfully built and deployed a production-ready oracle-backed stablecoin with cross-chain CCIP integration!

**What You've Learned:**
- ✅ Integrating Chainlink Data Streams for real-time price feeds
- ✅ Building collateral-backed stablecoins with oracle integration
- ✅ Deploying CCIP TokenPools for cross-chain transfers
- ✅ Configuring TokenAdminRegistry and cross-chain routes
- ✅ Executing Burn & Mint cross-chain token transfers
- ✅ Building chain-agnostic smart contract systems

**Next Steps:**
- Adapt this to other EVM chain pairs
- Add rebalancing mechanisms for scalability and sustainability
- Add liquidation mechanisms for under-collateralization
- Build a frontend interface for your stablecoin
- Implement emergency pause functionality
---
