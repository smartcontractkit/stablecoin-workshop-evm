# Chainlink Oracle-Backed Cross-Chain Stablecoin Workshop
## EVM → EVM Implementation Guide

This workshop guides you through building a production-ready oracle-backed stablecoin system with Chainlink CCIP cross-chain integration, enabling seamless token transfers between any two EVM chains.

## 🎯 System Overview

**What We're Building:**
- **Oracle-backed stablecoin** using Chainlink Price Feeds (ETH/USD on-chain data)
- **Cross-chain token transfers** via Chainlink CCIP (EVM ↔ EVM)
- **Chain-agnostic architecture** - works with any supported EVM chain pair
- **Automated price updates** from on-chain price feed aggregators

**Key Components:**
1. **DataStreamsOracle** - Reads and wraps Chainlink Price Feed data on-chain
2. **StablecoinERC20** - Mints tokens based on ETH collateral using oracle price data
3. **CCIP TokenPools** - Enable cross-chain Burn & Mint transfers
4. **TokenAdminRegistry** - Manages pool registration and cross-chain routing

---

## 📌 About This Workshop

This workshop uses **Arbitrum Sepolia → Avalanche Fuji** as a working example, but the architecture is **fully chain-agnostic**. 

**You can deploy to any EVM chain pair** that supports:
- ✅ Chainlink CCIP
- ✅ Chainlink Price Feeds

**All commands in this guide use Arbitrum Sepolia and Avalanche Fuji as examples.** Simply replace these network names with your chosen chains throughout the workshop.

**Using different chains?** See [Adapting to Other Chain Pairs](#-adapting-to-other-chain-pairs) at the end for configuration details.

---

## 📋 Prerequisites

### Required Tools (for Manual Setup)

- **Node.js v18+** and **npm**
- **Git**

**💡 Tip:** Using [Dev Container](#-option-a-dev-container-setup-recommended---easiest) (Option A below)? All tools are pre-installed—skip to Environment Setup!

### Required Accounts & Access

- **Wallet with testnet ETH** on both your chosen chains
- **LINK tokens** for CCIP fees on both chains
- **Block Explorer API Keys** (optional - for contract verification on Arbiscan/Snowtrace)

**Testnet Faucets:**
- Chainlink Faucet: https://faucets.chain.link/
- Avalanche Fuji: https://core.app/tools/testnet-faucet/

**💡 Tip:** Ask your instructor for testnet funds—it's faster!

---

## 🔧 Environment Setup (Required Before Phase 1)

**Choose your setup method:**

---

### 🐳 **Option A: Dev Container Setup (Recommended - Easiest)**

**Best for:** Workshops, beginners, anyone who wants zero setup hassle

**Prerequisites:**
- ✅ Docker Desktop installed ([Windows/Mac Download](https://www.docker.com/products/docker-desktop))
- ✅ VSCode or Cursor installed
- ✅ Dev Containers extension installed (Extension ID: `ms-vscode-remote.remote-containers`)

**⏱️ Setup Time:** 2-3 minutes (first time)

**Steps:**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/smartcontractkit/stablecoin-workshop-evm
   cd stablecoin-workshop-evm
   ```

2. **Open in your editor:**
   ```bash
   # For VSCode:
   code .
   
   # For Cursor:
   cursor .
   ```

3. **Reopen in Container:**
   - Click "Reopen in Container" when prompted
   - Wait 2-5 minutes for setup (automatic)
   - Container will install Node.js, dependencies, and compile contracts

4. **Configure credentials:**
   ```bash
   # Copy example file
   cp .env.example .env
   
   # Edit with your credentials
   vim .env
   ```
   Fill in: `PRIVATE_KEY`

5. **✅ You're ready!** Skip to [Phase 1](#️-phase-1-oracle--stablecoin-on-from-chain)

**✨ Benefits:**
- ✅ No Node.js installation needed
- ✅ No Git symlink configuration (Windows users rejoice!)
- ✅ Identical environment for everyone
- ✅ All dependencies pre-installed
- ✅ Hardhat auto-configured

**📖 Detailed Guide:** See [`.devcontainer/README.md`](.devcontainer/README.md)

---

### 💻 **Option B: Manual Local Setup**

**Best for:** Users who prefer local development or cannot use Docker

**⏱️ Setup Time:** 10-15 minutes

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

### Step 0.4b: Create Symlink for CCIP Submodule
```bash
# Create symlink so CCIP scripts can access .env
ln -sf ../../../../.env smart-contract-examples/ccip/cct/hardhat/.env
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

# Step 2: Private Key (REQUIRED - add your credentials)
PRIVATE_KEY=your_private_key_without_0x_prefix
```

**💡 Important:** Both `CHAIN_FROM`/`CHAIN_TO` AND your private key must be set for the workshop to work.

**✅ Pre-configured Values (Already Set in .env.example):**
- Default RPC URLs for both chains
- Chainlink Price Feed addresses for supported chains

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

**💡 Note:** With Price Feeds, the oracle automatically reads from on-chain data - no manual updates or LINK funding needed!

### Step 1.3: Deploy Stablecoin
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

### Step 1.4: Update Environment with Stablecoin Address
```bash
vim .env
# Find: STABLECOIN_CONTRACT_ADDRESS_FROM=
# Add your stablecoin address from Step 1.3
```

### Step 1.5: Test Collateral-Backed Minting
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

**✅ Checkpoint:** You now have a working oracle-backed stablecoin on your FROM chain with real Chainlink Price Feeds!

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
```

**Expected Output:**
```
✅ Oracle deployed: 0x[your-oracle-address]
📝 Update your .env file:
ORACLE_CONTRACT_ADDRESS_TO=0x[your-oracle-address]
```

**💡 Note:** The oracle automatically reads from Chainlink's on-chain Price Feed - no manual updates needed!

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

### Step 3.2a: Install CCIP Dependencies
```bash
npm install
```

### Step 3.2b: Setup Environment for CCIP Scripts
```bash
# Enable child processes to pick up environment variables within Hardhat
set -a

# Load environment variables from .env (symlinked)
source .env
```

**💡 What This Does:**
- Loads all required environment variables from your `.env` file
- The CCIP submodule Hardhat tasks can now access `$PRIVATE_KEY`, RPC URLs, and all deployed contract addresses

### Step 3.2c: Compile CCIP Contracts
```bash
# Compile contracts to ensure artifacts are available
npx hardhat compile
```

**💡 Why This Is Needed:** The CCIP deployment tasks require compiled contract artifacts to deploy TokenPools.

### Step 3.2d: Configure RPC URLs (If Not Already Set)

Before deploying TokenPools, ensure your RPC URLs are uncommented in `.env`:

```bash
# Edit .env (symlinked to root .env)
vim .env
```

**Uncomment these lines in your `.env` file:**
```bash
# For Arbitrum Sepolia (FROM chain)
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# For Avalanche Fuji (TO chain)
AVALANCHE_FUJI_RPC_URL=https://avalanche-fuji-c-chain-rpc.publicnode.com
```

**💡 Tip:** If you're using different chains, uncomment the appropriate RPC URLs for your chain pair.

```bash
# Reload environment variables to pick up RPC URLs
source .env
```

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

**💡 Transfer Direction:** This phase demonstrates FROM → TO transfer (the natural flow). We also include a reverse TO → FROM example to showcase bidirectional capability.

### Step 5.1a: Return to Project Root
```bash
cd ../../../../
```

### Step 5.1b: Load Environment Variables
```bash
source .env
```

### Step 5.1c: Check Balance on FROM Chain
```bash
npx hardhat run scripts/check-balance.ts --network arbitrum-sepolia
```

**Expected Output:**
```
💰 Balance on arbitrum-sepolia:
   Address: 0x4fed0A5B65eac383D36E65733786386709B86be8
   Balance: 401.388 OBSC
```

**💡 Note:** This shows your balance on the FROM chain where you minted tokens in Phase 1.

### Step 5.2a: Navigate to CCIP Submodule
```bash
cd smart-contract-examples/ccip/cct/hardhat
```

### Step 5.2b: Load Environment Variables
```bash
source .env
```

### Step 5.2c: Execute Cross-Chain Transfer (FROM → TO)
```bash
# Transfer tokens from FROM chain to TO chain
# Replace <YOUR_WALLET_ADDRESS> with your actual wallet address (same address as your PRIVATE_KEY)
npx hardhat transferTokens \
  --tokenaddress $STABLECOIN_CONTRACT_ADDRESS_FROM \
  --amount 10000000000000000000 \
  --destinationchain avalancheFuji \
  --receiveraddress <YOUR_WALLET_ADDRESS> \
  --fee LINK \
  --network arbitrumSepolia
```

**💡 Getting Your Wallet Address:**
- If you don't know your wallet address, you can find it in MetaMask or any wallet app
- It's the same address that corresponds to your `PRIVATE_KEY` in `.env`
- Format: `0x1234...abcd` (42 characters starting with 0x)

**💡 Amount Format:** The amount is in wei (18 decimals). To transfer 10 tokens, use `10000000000000000000`.

**💡 Network Names:** Replace `arbitrumSepolia` with your FROM chain (camelCase) and `avalancheFuji` with your TO chain.

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
- **On Success:** Tokens will be burned on FROM chain and minted on TO chain

### Step 5.4: Verify Receipt (After 10-20 minutes)
```bash
# Return to project root
cd ../../../../

# Load environment variables
source .env

# Check balance on destination chain (TO chain)
npx hardhat run scripts/check-balance.ts --network avalanche-fuji
```

**Expected Output:**
```
💰 Balance on avalanche-fuji:
   Address: 0x4fed0A5B65eac383D36E65733786386709B86be8
   Balance: 10.0 OBSC

✅ Tokens successfully received from FROM chain!
```

**✅ Success!** You've completed a cross-chain transfer of oracle-backed stablecoins!

---

### 🔄 Bonus: Reverse Transfer (TO → FROM)

**Want to test bidirectional transfers?** Try sending tokens back:

```bash
# Navigate to CCIP submodule (if not already there)
cd smart-contract-examples/ccip/cct/hardhat

# Load environment variables
source .env

# Transfer tokens from TO chain back to FROM chain
npx hardhat transferTokens \
  --tokenaddress $STABLECOIN_CONTRACT_ADDRESS_TO \
  --amount 10000000000000000000 \
  --destinationchain arbitrumSepolia \
  --receiveraddress <YOUR_WALLET_ADDRESS> \
  --fee LINK \
  --network avalancheFuji
```

**Expected Flow:** Tokens burn on TO chain (Avalanche Fuji) → mint on FROM chain (Arbitrum Sepolia)

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
- Price Feed: https://docs.chain.link/data-feeds/price-feeds/addresses
- Feed ID: Use any unique bytes32 identifier for your deployment

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

### How to Verify Deployed Contracts

If you want to verify your contracts on block explorers (Arbiscan, Snowtrace, etc.), add the appropriate API key to your `.env` file and run:

**Verify Oracle:**
```bash
npx hardhat verify --network arbitrum-sepolia \
  <ORACLE_ADDRESS> \
  "0x2ff010DEbC1297f19579B4246cad07bd24F2488A" \
  "0x000359843a543ee2fe414dc14c7e7920ef10f4372990b79d6361cdc0dd1ba782"
```

**Verify Stablecoin:**
```bash
npx hardhat verify --network arbitrum-sepolia \
  <STABLECOIN_ADDRESS> \
  "Oracle-Backed Stablecoin" \
  "OBSC" \
  0 \
  "<ORACLE_ADDRESS>" \
  "0x000359843a543ee2fe414dc14c7e7920ef10f4372990b79d6361cdc0dd1ba782"
```

Replace `<ORACLE_ADDRESS>` and `<STABLECOIN_ADDRESS>` with your deployed contract addresses.

**Required API Keys in `.env`:**
- `ARBISCAN_API_KEY` for Arbitrum Sepolia
- `SNOWTRACE_API_KEY` for Avalanche Fuji
- Get keys from: https://sepolia.arbiscan.io/myapikey or https://testnet.snowtrace.io/myapikey

---

### Common Issues and Solutions

#### 1. "Insufficient LINK for fees"
**Solution:** Get LINK tokens from faucet
```bash
# Visit: https://faucets.chain.link/
# Select your chain and request LINK
```

#### 2. "Network doesn't exist" in CCIP Submodule
**Problem:** CCIP submodule uses camelCase network names
**Solution:** Use correct network names
```bash
# ❌ Wrong: arbitrum-sepolia
# ✅ Correct: arbitrumSepolia

# ❌ Wrong: avalanche-fuji  
# ✅ Correct: avalancheFuji
```

#### 3. Pool Doesn't Have Mint/Burn Roles
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

#### 4. "Blockhash not found" or RPC Errors
**Problem:** Temporary network congestion
**Solution:** Wait a few seconds and retry the command

#### 5. Transfer Shows Wrong Receiver Address
**Solution:** Ensure you're using `--receiveraddress` parameter
```bash
# ✅ Correct
npx hardhat transferTokens --receiveraddress 0x[your-address] ...
```

#### 6. Price Seems Too Large
**Problem:** Crypto prices use 18 decimals, not 8
**Solution:** This is correct - divide by 1e18
```
Raw price: 4013880000000000000000
Actual price: $4,013.88
```

#### 7. Transaction Fails with "insufficient funds"
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

**💡 Note:** After running `source .env`, all variables (including `PRIVATE_KEY` and all contract addresses) are automatically available in your shell.

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
- **Price Feeds:** https://docs.chain.link/data-feeds/price-feeds
- **CCIP:** https://docs.chain.link/ccip

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
- ✅ Integrating Chainlink Price Feeds for on-chain price data
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
