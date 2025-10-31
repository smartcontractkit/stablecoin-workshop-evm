# Automated CCIP TokenPool Deployment

Single Foundry script that automates Phase 3 & 4 from INSTRUCTIONS.md.

## Quick Start

```bash
cd foundry

# Run automated deployment
forge script script/DeployCCIP.s.sol:DeployCCIP \
  --fork-url $ARBITRUM_SEPOLIA_RPC_URL \
  --broadcast --legacy
```

## What It Does

- Deploys `BurnMintTokenPool` on both chains
- Grants mint/burn roles
- Registers token admins
- Configures bidirectional routes

Replaces 30+ manual commands with 1 automated script.

## Files

- `script/DeployCCIP.s.sol` - Main automation script
- `script/HelperConfig.s.sol` - Chain configurations
- `test/DeployCCIP.t.sol` - Unit tests
