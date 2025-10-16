#!/bin/bash
set -e

echo "🚀 Setting up Chainlink Stablecoin Workshop environment..."

# Install system utilities (vim, curl, etc.)
echo "🛠️  Installing system utilities..."
sudo apt-get update -qq && sudo apt-get install -y -qq vim curl wget nano

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Initialize and update submodules
echo "📦 Initializing git submodules (this may take a few minutes)..."
git submodule update --init --recursive

# Install submodule dependencies
echo "📦 Installing CCIP submodule dependencies..."
cd smart-contract-examples/ccip/cct/hardhat
npm install
cd ../../../..

# Create symlink for .env (if it doesn't exist)
if [ ! -L "smart-contract-examples/ccip/cct/hardhat/.env" ]; then
    echo "🔗 Creating .env symlink..."
    cd smart-contract-examples/ccip/cct/hardhat
    ln -sf ../../../../.env .env
    cd ../../../..
fi

# Compile contracts to verify setup
echo "🔨 Compiling contracts..."
npx hardhat compile

echo ""
echo "✅ Setup complete! You're ready to start the workshop."
echo ""
echo "📝 Next steps:"
echo "   1. Copy .env.example to .env: cp .env.example .env"
echo "   2. Fill in your credentials in .env"
echo "   3. Start with Phase 1 in INSTRUCTIONS.md"
echo ""





