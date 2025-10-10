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

## 📋 Prerequisites

### Required Tools

**Node.js (v18+) and npm**
- Download from: https://nodejs.org/
- Or use package manager: `brew install node` (macOS) / `apt install nodejs npm` (Ubuntu)

**Git**
- Install via your system package manager or https://git-scm.com/downloads

### Required Accounts & Access

**Testnet Funds:**
- **Wallet with testnet ETH** on both chains
  - Arbitrum Sepolia: https://faucets.chain.link/arbitrum-sepolia
  - Avalanche Fuji: https://core.app/tools/testnet-faucet/
  - **Ask instructor for testnet funds** (recommended - faster)
- **LINK tokens** for CCIP fees
  - Arbitrum Sepolia LINK: https://faucets.chain.link/arbitrum-sepolia
  - Avalanche Fuji LINK: https://faucets.chain.link/avalanche-fuji

**Chainlink Data Streams Access:**
- API Key and Secret (provided in workshop)

---

## 🔧 Environment Setup (Required Before Phase 1)

### Step 0.1: Clone the Workshop Repository
```bash
git clone https://github.com/smartcontractkit/stablecoin-workshop-evm
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
CHAIN_FROM=arbitrum-sepolia
CHAIN_TO=avalanche-fuji

# Step 2: Private Key & API Credentials (REQUIRED - add your credentials)
PRIVATE_KEY=your_private_key_without_0x_prefix
DATASTREAMS_API_KEY=your_chainlink_api_key
DATASTREAMS_API_SECRET=your_chainlink_api_secret
```

**💡 Important:** Both `CHAIN_FROM`/`CHAIN_TO` AND your credentials must be set for the workshop to work.

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

## 🏗️ Phase 1: Oracle & Stablecoin on FROM Chain (Arbitrum Sepolia)

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

**✅ Checkpoint:** You now have a working oracle-backed stablecoin on Arbitrum Sepolia with real Chainlink Data Streams price feeds!

---

## 🏗️ Phase 2: Oracle & Stablecoin on TO Chain (Avalanche Fuji)

### Step 2.1: Deploy Oracle on TO Chain
```bash
npx hardhat run scripts/deploy-oracle.ts --network avalanche-fuji
```

**Expected Output:**
```
✅ Oracle deployed: 0x[your-oracle-address]
Role: 🟢 DESTINATION (TO)
```

### Step 2.2: Update Environment with TO Chain Oracle
```bash
vim .env
# Find: ORACLE_CONTRACT_ADDRESS_TO=
# Add your oracle address from Step 2.1
```

### Step 2.3: Fund TO Chain Oracle
```bash
npx hardhat run scripts/fund-oracle.ts --network avalanche-fuji
```

### Step 2.4: Update TO Chain Oracle
```bash
npx hardhat run scripts/update-oracle.ts --network avalanche-fuji
```

### Step 2.5: Deploy TO Chain Stablecoin
```bash
npx hardhat run scripts/deploy-stablecoin.ts --network avalanche-fuji
```

**Expected Output:**
```
✅ Stablecoin deployed: 0x[your-stablecoin-address]
Role: 🟢 DESTINATION (TO)
```

### Step 2.6: Update Environment with TO Chain Stablecoin
```bash
vim .env
# Find: STABLECOIN_CONTRACT_ADDRESS_TO=
# Add your stablecoin address from Step 2.5
```

### Step 2.7: Test Minting on TO Chain (Optional)
```bash
npx hardhat run scripts/mint-stablecoin.ts --network avalanche-fuji
```

**✅ Checkpoint:** You now have oracle-backed stablecoins deployed on both chains!

---

## 🌉 Phase 3: CCIP TokenPool Deployment

### Step 3.1: Navigate to CCIP Submodule
```bash
cd smart-contract-examples/ccip/cct/hardhat
```

### Step 3.2: Setup Environment for CCIP Scripts
```bash
# Export environment variables for Hardhat
export ARBITRUM_SEPOLIA_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
export AVALANCHE_FUJI_RPC_URL="https://avalanche-fuji-c-chain-rpc.publicnode.com"
export PRIVATE_KEY=$(grep "^PRIVATE_KEY=" ../../../../.env | cut -d= -f2)
```

**💡 What This Does:**
- Exports RPC URLs so the CCIP submodule can connect to both chains
- Reads your private key from the root `.env` file
- Required because the submodule uses `@chainlink/env-enc` which needs explicit exports

### Step 3.3: Deploy TokenPool on FROM Chain
```bash
# Load stablecoin address from .env
export STABLECOIN_FROM=$(grep "^STABLECOIN_CONTRACT_ADDRESS_FROM=" ../../../../.env | cut -d= -f2)

# Deploy TokenPool
npx hardhat deployTokenPool \
  --network arbitrumSepolia \
  --tokenaddress $STABLECOIN_FROM \
  --pooltype burnMint
```

**Expected Output:**
```
Token pool deployed to: 0x[your-pool-address]
(Ignore the error about granting roles - we'll handle that separately)
```

**Key Address to Save:**
- **TokenPool Address (FROM):** Copy the pool address from output

### Step 3.4: Update Environment with FROM Chain Pool
```bash
vim ../../../../.env
# Find: TOKEN_POOL_ADDRESS_FROM=
# Add your pool address from Step 3.3
```

### Step 3.5: Grant Mint/Burn Roles on FROM Chain
```bash
# Return to project root
cd ../../../../

# Grant roles using our custom script
npx hardhat run scripts/grant-roles.ts --network arbitrum-sepolia
```

**Expected Output:**
```
🔵 Detected as SOURCE chain (FROM)
✅ Granting minter role to pool...
✅ Granting burner role to pool...
📋 Final role verification:
  Pool is Minter: ✅
  Pool is Burner: ✅
```

### Step 3.6: Deploy TokenPool on TO Chain
```bash
# Navigate back to CCIP submodule
cd smart-contract-examples/ccip/cct/hardhat

# Reload environment
export AVALANCHE_FUJI_RPC_URL="https://avalanche-fuji-c-chain-rpc.publicnode.com"
export PRIVATE_KEY=$(grep "^PRIVATE_KEY=" ../../../../.env | cut -d= -f2)
export STABLECOIN_TO=$(grep "^STABLECOIN_CONTRACT_ADDRESS_TO=" ../../../../.env | cut -d= -f2)

# Deploy TokenPool on TO chain
npx hardhat deployTokenPool \
  --network avalancheFuji \
  --tokenaddress $STABLECOIN_TO \
  --pooltype burnMint
```

### Step 3.7: Update Environment with TO Chain Pool
```bash
vim ../../../../.env
# Find: TOKEN_POOL_ADDRESS_TO=
# Add your pool address from Step 3.6
```

### Step 3.8: Grant Mint/Burn Roles on TO Chain
```bash
# Return to project root
cd ../../../../

# Grant roles
npx hardhat run scripts/grant-roles.ts --network avalanche-fuji
```

**Expected Output:**
```
🟢 Detected as DESTINATION chain (TO)
✅ Pool is Minter: ✅
✅ Pool is Burner: ✅
```

**✅ Checkpoint:** Both TokenPools are deployed with proper mint/burn permissions!

---

## 🔗 Phase 4: CCIP Registration & Configuration

### Step 4.1: Setup Environment Variables
```bash
# Navigate to CCIP submodule
cd smart-contract-examples/ccip/cct/hardhat

# Export all required variables
export ARBITRUM_SEPOLIA_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
export AVALANCHE_FUJI_RPC_URL="https://avalanche-fuji-c-chain-rpc.publicnode.com"
export PRIVATE_KEY=$(grep "^PRIVATE_KEY=" ../../../../.env | cut -d= -f2)
```

### Step 4.2: Load Deployment Addresses
```bash
# Load stablecoin and pool addresses from .env
export STABLECOIN_FROM=$(grep "^STABLECOIN_CONTRACT_ADDRESS_FROM=" ../../../../.env | cut -d= -f2)
export STABLECOIN_TO=$(grep "^STABLECOIN_CONTRACT_ADDRESS_TO=" ../../../../.env | cut -d= -f2)
export POOL_FROM=$(grep "^TOKEN_POOL_ADDRESS_FROM=" ../../../../.env | cut -d= -f2)
export POOL_TO=$(grep "^TOKEN_POOL_ADDRESS_TO=" ../../../../.env | cut -d= -f2)

# Verify all addresses are loaded
echo "FROM Stablecoin: $STABLECOIN_FROM"
echo "FROM Pool: $POOL_FROM"
echo "TO Stablecoin: $STABLECOIN_TO"
echo "TO Pool: $POOL_TO"
```

### Step 4.3: Claim Admin on FROM Chain
```bash
npx hardhat claimAdmin \
  --network arbitrumSepolia \
  --tokenaddress $STABLECOIN_FROM \
  --mode owner
```

**Expected Output:**
```
✅ Successfully claimed admin using owner mode
```

### Step 4.4: Claim Admin on TO Chain
```bash
npx hardhat claimAdmin \
  --network avalancheFuji \
  --tokenaddress $STABLECOIN_TO \
  --mode owner
```

### Step 4.5: Accept Admin Role on FROM Chain
```bash
npx hardhat acceptAdminRole \
  --network arbitrumSepolia \
  --tokenaddress $STABLECOIN_FROM
```

**Expected Output:**
```
Accepted admin role for token [...] tx: 0x[...]
```

### Step 4.6: Accept Admin Role on TO Chain
```bash
npx hardhat acceptAdminRole \
  --network avalancheFuji \
  --tokenaddress $STABLECOIN_TO
```

### Step 4.7: Set Pool on FROM Chain
```bash
npx hardhat setPool \
  --network arbitrumSepolia \
  --tokenaddress $STABLECOIN_FROM \
  --pooladdress $POOL_FROM
```

**Expected Output:**
```
Pool set for token [...] to [...]
```

### Step 4.8: Set Pool on TO Chain
```bash
npx hardhat setPool \
  --network avalancheFuji \
  --tokenaddress $STABLECOIN_TO \
  --pooladdress $POOL_TO
```

### Step 4.9: Configure FROM → TO Route
```bash
npx hardhat applyChainUpdates \
  --network arbitrumSepolia \
  --pooladdress $POOL_FROM \
  --remotechain avalancheFuji \
  --remotepooladdresses $POOL_TO \
  --remotetokenaddress $STABLECOIN_TO
```

**Expected Output:**
```
✅ Chain update applied successfully!
```

### Step 4.10: Configure TO → FROM Route
```bash
npx hardhat applyChainUpdates \
  --network avalancheFuji \
  --pooladdress $POOL_TO \
  --remotechain arbitrumSepolia \
  --remotepooladdresses $POOL_FROM \
  --remotetokenaddress $STABLECOIN_FROM
```

**Expected Output:**
```
✅ Chain update applied successfully!
```

**✅ Checkpoint:** CCIP is fully configured for bidirectional cross-chain transfers!

---

## 🚀 Phase 5: Execute Cross-Chain Transfer

### Step 5.1: Check Your Balance
```bash
# Return to project root
cd ../../../../

# Check your stablecoin balance
npx hardhat console --network avalanche-fuji
```

```javascript
// In Hardhat console:
const stablecoin = await ethers.getContractAt("StablecoinERC20", "0x[your-STABLECOIN_CONTRACT_ADDRESS_TO]");
const [signer] = await ethers.getSigners();
const balance = await stablecoin.balanceOf(signer.address);
console.log("Balance:", ethers.formatEther(balance), "OBSC");
.exit
```

### Step 5.2: Execute Cross-Chain Transfer
```bash
# Navigate to CCIP submodule
cd smart-contract-examples/ccip/cct/hardhat

# Reload environment
export AVALANCHE_FUJI_RPC_URL="https://avalanche-fuji-c-chain-rpc.publicnode.com"
export PRIVATE_KEY=$(grep "^PRIVATE_KEY=" ../../../../.env | cut -d= -f2)
export STABLECOIN_TO=$(grep "^STABLECOIN_CONTRACT_ADDRESS_TO=" ../../../../.env | cut -d= -f2)

# Get your wallet address (or replace with your address manually)
export YOUR_ADDRESS=$(node -e "console.log(new (require('ethers').Wallet)('$PRIVATE_KEY').address)")

# Transfer tokens (example: 10 OBSC = 10000000000000000000 wei)
npx hardhat transferTokens \
  --tokenaddress $STABLECOIN_TO \
  --amount 10000000000000000000 \
  --destinationchain arbitrumSepolia \
  --receiveraddress $YOUR_ADDRESS \
  --fee LINK \
  --network avalancheFuji
```

**💡 Amount Format:** The amount is in wei (18 decimals). To transfer 10 tokens, use `10000000000000000000`.

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
- **On Success:** Tokens will be burned on Avalanche Fuji and minted on Arbitrum Sepolia

### Step 5.4: Verify Receipt (After 10-20 minutes)
```bash
# Return to project root
cd ../../../../

# Check balance on destination chain
npx hardhat console --network arbitrum-sepolia
```

```javascript
// In Hardhat console:
const stablecoin = await ethers.getContractAt("StablecoinERC20", "0x[your-STABLECOIN_CONTRACT_ADDRESS_FROM]");
const [signer] = await ethers.getSigners();
const balance = await stablecoin.balanceOf(signer.address);
console.log("Balance:", ethers.formatEther(balance), "OBSC");
.exit
```

**✅ Success!** You've completed a cross-chain transfer of oracle-backed stablecoins!

---

## 🧪 Verification Commands (Optional)

### Check Pool Configuration
```bash
npx hardhat run scripts/check-pool-config.ts --network arbitrum-sepolia
npx hardhat run scripts/check-pool-config.ts --network avalanche-fuji
```

### Check Oracle Price
```bash
npx hardhat run scripts/update-oracle.ts --network arbitrum-sepolia
```

### Check Collateralization Status
```bash
npx hardhat console --network arbitrum-sepolia
```

```javascript
const stablecoin = await ethers.getContractAt("StablecoinERC20", "0x[your-address]");
const [collateral, supply, ratio] = await stablecoin.getCollateralizationStatus();
console.log("Collateral:", ethers.formatEther(collateral), "USD");
console.log("Supply:", ethers.formatEther(supply), "OBSC");
console.log("Ratio:", Number(ratio) / 100, "%");
.exit
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
**Solution:** Run grant-roles script
```bash
npx hardhat run scripts/grant-roles.ts --network [your-network]
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
**Solution:** Get more testnet ETH
```bash
# Arbitrum Sepolia: https://faucets.chain.link/arbitrum-sepolia
# Avalanche Fuji: https://core.app/tools/testnet-faucet/
```

#### 9. Environment Variables Not Loading
**Solution:** Reload your environment
```bash
source .env
# Or for CCIP submodule:
export PRIVATE_KEY=$(grep "^PRIVATE_KEY=" .env | cut -d= -f2)
```

#### 10. "Cannot find module" Errors
**Solution:** Reinstall dependencies
```bash
npm install
cd smart-contract-examples/ccip/cct/hardhat
npm install
```

---
