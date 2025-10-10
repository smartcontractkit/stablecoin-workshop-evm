# CCIP Cross-Chain Stablecoin Setup Workflow

Complete command-by-command guide for enabling cross-chain transfers between Arbitrum Sepolia and Avalanche Fuji.

## Prerequisites

```bash
# Ensure both networks are funded
# Arbitrum Sepolia: ETH + LINK
# Avalanche Fuji: AVAX + LINK

# Verify existing deployments
echo "Arbitrum Stablecoin: $STABLECOIN_ADDRESS_ARBITRUM"
echo "Arbitrum Oracle: $ORACLE_ADDRESS_ARBITRUM"
```

---

## Phase 1: Deploy on Avalanche Fuji

### 1.1 Deploy Oracle on Fuji
```bash
npx hardhat run scripts/deploy-oracle.ts --network avalancheFuji
# Output: ORACLE_ADDRESS_FUJI (add to .env)
```

### 1.2 Fund Oracle with LINK
```bash
npx hardhat run scripts/fund-oracle.ts --network avalancheFuji
```

### 1.3 Update Oracle Price
```bash
npx hardhat run scripts/update-oracle.ts --network avalancheFuji
```

### 1.4 Deploy Stablecoin on Fuji
```bash
npx hardhat run scripts/deploy-stablecoin.ts --network avalancheFuji
# Output: STABLECOIN_ADDRESS_FUJI (add to .env)
```

### 1.5 Test Minting on Fuji
```bash
npx hardhat run scripts/mint-stablecoin.ts --network avalancheFuji
```

---

## Phase 2: Deploy TokenPools

### 2.1 Deploy TokenPool on Arbitrum Sepolia
```bash
cd smart-contract-examples/ccip/cct/hardhat

npx hardhat deployTokenPool \
  --tokenaddress $STABLECOIN_ADDRESS_ARBITRUM \
  --pooltype burnMint \
  --localtokendecimals 18 \
  --network arbitrumSepolia

# Output: TOKEN_POOL_ADDRESS_ARBITRUM (add to .env)
cd ../../../../
```

### 2.2 Deploy TokenPool on Avalanche Fuji
```bash
cd smart-contract-examples/ccip/cct/hardhat

npx hardhat deployTokenPool \
  --tokenaddress $STABLECOIN_ADDRESS_FUJI \
  --pooltype burnMint \
  --localtokendecimals 18 \
  --network avalancheFuji

# Output: TOKEN_POOL_ADDRESS_FUJI (add to .env)
cd ../../../../
```

---

## Phase 3: Grant Roles to TokenPools

### 3.1 Grant Roles on Arbitrum Sepolia
```bash
npx hardhat run scripts/grant-roles.ts --network arbitrumSepolia
```

### 3.2 Grant Roles on Avalanche Fuji
```bash
npx hardhat run scripts/grant-roles.ts --network avalancheFuji
```

### 3.3 Verify Configuration
```bash
npx hardhat run scripts/check-pool-config.ts --network arbitrumSepolia
npx hardhat run scripts/check-pool-config.ts --network avalancheFuji
```

---

## Phase 4: Register with TokenAdminRegistry

### 4.1 Claim Admin on Arbitrum Sepolia
```bash
cd smart-contract-examples/ccip/cct/hardhat

npx hardhat claimAdmin \
  --tokenaddress $STABLECOIN_ADDRESS_ARBITRUM \
  --mode owner \
  --network arbitrumSepolia

cd ../../../../
```

### 4.2 Claim Admin on Avalanche Fuji
```bash
cd smart-contract-examples/ccip/cct/hardhat

npx hardhat claimAdmin \
  --tokenaddress $STABLECOIN_ADDRESS_FUJI \
  --mode owner \
  --network avalancheFuji

cd ../../../../
```

### 4.3 Accept Admin Role on Arbitrum Sepolia
```bash
cd smart-contract-examples/ccip/cct/hardhat

npx hardhat acceptAdminRole \
  --tokenaddress $STABLECOIN_ADDRESS_ARBITRUM \
  --network arbitrumSepolia

cd ../../../../
```

### 4.4 Accept Admin Role on Avalanche Fuji
```bash
cd smart-contract-examples/ccip/cct/hardhat

npx hardhat acceptAdminRole \
  --tokenaddress $STABLECOIN_ADDRESS_FUJI \
  --network avalancheFuji

cd ../../../../
```

---

## Phase 5: Link Pools to Tokens

### 5.1 Set Pool on Arbitrum Sepolia
```bash
cd smart-contract-examples/ccip/cct/hardhat

npx hardhat setPool \
  --tokenaddress $STABLECOIN_ADDRESS_ARBITRUM \
  --pooladdress $TOKEN_POOL_ADDRESS_ARBITRUM \
  --network arbitrumSepolia

cd ../../../../
```

### 5.2 Set Pool on Avalanche Fuji
```bash
cd smart-contract-examples/ccip/cct/hardhat

npx hardhat setPool \
  --tokenaddress $STABLECOIN_ADDRESS_FUJI \
  --pooladdress $TOKEN_POOL_ADDRESS_FUJI \
  --network avalancheFuji

cd ../../../../
```

---

## Phase 6: Configure Cross-Chain Routes

### 6.1 Configure Arbitrum → Fuji Route
```bash
cd smart-contract-examples/ccip/cct/hardhat

npx hardhat applyChainUpdates \
  --pooladdress $TOKEN_POOL_ADDRESS_ARBITRUM \
  --remotechain avalancheFuji \
  --remotepooladdresses $TOKEN_POOL_ADDRESS_FUJI \
  --remotetokenaddress $STABLECOIN_ADDRESS_FUJI \
  --outboundratelimitenabled true \
  --outboundratelimitcapacity 1000000000000000000000 \
  --outboundratelimitrate 100000000000000000 \
  --inboundratelimitenabled true \
  --inboundratelimitcapacity 1000000000000000000000 \
  --inboundratelimitrate 100000000000000000 \
  --network arbitrumSepolia

cd ../../../../
```

### 6.2 Configure Fuji → Arbitrum Route
```bash
cd smart-contract-examples/ccip/cct/hardhat

npx hardhat applyChainUpdates \
  --pooladdress $TOKEN_POOL_ADDRESS_FUJI \
  --remotechain arbitrumSepolia \
  --remotepooladdresses $TOKEN_POOL_ADDRESS_ARBITRUM \
  --remotetokenaddress $STABLECOIN_ADDRESS_ARBITRUM \
  --outboundratelimitenabled true \
  --outboundratelimitcapacity 1000000000000000000000 \
  --outboundratelimitrate 100000000000000000 \
  --inboundratelimitenabled true \
  --inboundratelimitcapacity 1000000000000000000000 \
  --inboundratelimitrate 100000000000000000 \
  --network avalancheFuji

cd ../../../../
```

### 6.3 Verify Pool Configuration
```bash
cd smart-contract-examples/ccip/cct/hardhat

npx hardhat getPoolConfig \
  --pooladdress $TOKEN_POOL_ADDRESS_ARBITRUM \
  --network arbitrumSepolia

npx hardhat getPoolConfig \
  --pooladdress $TOKEN_POOL_ADDRESS_FUJI \
  --network avalancheFuji

cd ../../../../
```

---

## Phase 7: Test Cross-Chain Transfer

### 7.1 Mint Stablecoins on Arbitrum (Source)
```bash
npx hardhat run scripts/mint-stablecoin.ts --network arbitrumSepolia
# Mint at least 100 OBSC for testing
```

### 7.2 Check Balance Before Transfer
```bash
# On Arbitrum
cast call $STABLECOIN_ADDRESS_ARBITRUM \
  "balanceOf(address)(uint256)" \
  $YOUR_ADDRESS \
  --rpc-url $ARBITRUM_SEPOLIA_RPC_URL

# On Fuji (should be 0 or existing balance)
cast call $STABLECOIN_ADDRESS_FUJI \
  "balanceOf(address)(uint256)" \
  $YOUR_ADDRESS \
  --rpc-url $AVALANCHE_FUJI_RPC_URL
```

### 7.3 Approve TokenPool to Spend Tokens
```bash
cast send $STABLECOIN_ADDRESS_ARBITRUM \
  "approve(address,uint256)" \
  $TOKEN_POOL_ADDRESS_ARBITRUM \
  100000000000000000000 \
  --private-key $PRIVATE_KEY \
  --rpc-url $ARBITRUM_SEPOLIA_RPC_URL
```

### 7.4 Execute Cross-Chain Transfer
```bash
cd smart-contract-examples/ccip/cct/hardhat

npx hardhat transferTokens \
  --tokenaddress $STABLECOIN_ADDRESS_ARBITRUM \
  --amount 100000000000000000000 \
  --destinationchain avalancheFuji \
  --receiveraddress $YOUR_ADDRESS \
  --fee LINK \
  --network arbitrumSepolia

# Output: Message ID (track on CCIP Explorer)
cd ../../../../
```

### 7.5 Track Transfer
```bash
# Visit: https://ccip.chain.link/msg/<MESSAGE_ID>
# Wait for "Success" status (typically 10-20 minutes)
```

### 7.6 Verify Balance After Transfer
```bash
# On Arbitrum (should decrease by 100 OBSC)
cast call $STABLECOIN_ADDRESS_ARBITRUM \
  "balanceOf(address)(uint256)" \
  $YOUR_ADDRESS \
  --rpc-url $ARBITRUM_SEPOLIA_RPC_URL

# On Fuji (should increase by 100 OBSC)
cast call $STABLECOIN_ADDRESS_FUJI \
  "balanceOf(address)(uint256)" \
  $YOUR_ADDRESS \
  --rpc-url $AVALANCHE_FUJI_RPC_URL
```

---

## Phase 8: Test Return Transfer (Fuji → Arbitrum)

### 8.1 Approve and Transfer Back
```bash
# Approve
cast send $STABLECOIN_ADDRESS_FUJI \
  "approve(address,uint256)" \
  $TOKEN_POOL_ADDRESS_FUJI \
  50000000000000000000 \
  --private-key $PRIVATE_KEY \
  --rpc-url $AVALANCHE_FUJI_RPC_URL

# Transfer
cd smart-contract-examples/ccip/cct/hardhat

npx hardhat transferTokens \
  --tokenaddress $STABLECOIN_ADDRESS_FUJI \
  --amount 50000000000000000000 \
  --destinationchain arbitrumSepolia \
  --receiveraddress $YOUR_ADDRESS \
  --fee LINK \
  --network avalancheFuji

cd ../../../../
```

---

## Troubleshooting

### Check Rate Limits
```bash
cd smart-contract-examples/ccip/cct/hardhat

npx hardhat getCurrentRateLimits \
  --pooladdress $TOKEN_POOL_ADDRESS_ARBITRUM \
  --remotechain avalancheFuji \
  --network arbitrumSepolia

cd ../../../../
```

### Update Rate Limits (if needed)
```bash
cd smart-contract-examples/ccip/cct/hardhat

npx hardhat updateRateLimiters \
  --pooladdress $TOKEN_POOL_ADDRESS_ARBITRUM \
  --remotechain avalancheFuji \
  --ratelimiter both \
  --outboundratelimitenabled true \
  --outboundratelimitcapacity 10000000000000000000000 \
  --outboundratelimitrate 1000000000000000000 \
  --network arbitrumSepolia

cd ../../../../
```

### Check Pool Configuration
```bash
npx hardhat run scripts/check-pool-config.ts --network arbitrumSepolia
npx hardhat run scripts/check-pool-config.ts --network avalancheFuji
```

---

## Environment Variables Reference

Required `.env` entries:

```bash
# Networks
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Private Key
PRIVATE_KEY=your_private_key_without_0x

# Data Streams API
DATASTREAMS_API_KEY=your_api_key
DATASTREAMS_API_SECRET=your_api_secret

# Arbitrum Sepolia Deployments
ORACLE_ADDRESS_ARBITRUM=0x...
STABLECOIN_ADDRESS_ARBITRUM=0x...
TOKEN_POOL_ADDRESS_ARBITRUM=0x...

# Avalanche Fuji Deployments
ORACLE_ADDRESS_FUJI=0x...
STABLECOIN_ADDRESS_FUJI=0x...
TOKEN_POOL_ADDRESS_FUJI=0x...
```

---

## Key Concepts

### Burn and Mint Mechanism
- **Outbound Transfer**: Tokens are burned on source chain
- **Inbound Transfer**: New tokens are minted on destination chain
- **Result**: Total supply remains constant across all chains

### Rate Limits
- **Capacity**: Maximum tokens in the bucket (max single transfer)
- **Rate**: Tokens refilled per second (sustained throughput)
- Example: 1000 capacity, 0.1 rate = 1000 tokens/tx, 360 tokens/hour sustained

### Role Management
- **Minter Role**: Allows TokenPool to mint tokens on receiving transfers
- **Burner Role**: Allows TokenPool to burn tokens on sending transfers
- Both roles required for bidirectional transfers

---

## Success Criteria

✅ Stablecoin deployed on both chains
✅ TokenPools deployed on both chains
✅ Roles granted to both pools
✅ Admin claimed and pools linked
✅ Cross-chain routes configured (bidirectional)
✅ Test transfer Arbitrum → Fuji successful
✅ Test transfer Fuji → Arbitrum successful
✅ Balances update correctly on both chains

