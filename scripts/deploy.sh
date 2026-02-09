#!/bin/bash
set -e

# Deploy Backyard Bets contracts to NEAR testnet
# Usage: bash scripts/deploy.sh <your-account.testnet>

ACCOUNT_ID=${1:?"Usage: bash scripts/deploy.sh <your-account.testnet>"}
BETS_CONTRACT="bets.${ACCOUNT_ID}"
ORACLE_CONTRACT="oracle.${ACCOUNT_ID}"

echo "=== Deploying Backyard Bets to NEAR Testnet ==="
echo "Account: $ACCOUNT_ID"
echo "Bets contract: $BETS_CONTRACT"
echo "Oracle contract: $ORACLE_CONTRACT"
echo ""

# Build contracts
echo "--- Building contracts ---"
cd contracts/backyard-bets && npm run build && cd ../..
cd contracts/oracle && npm run build && cd ../..

# Create sub-accounts for contracts
echo "--- Creating sub-accounts ---"
near create-account "$BETS_CONTRACT" --masterAccount "$ACCOUNT_ID" --initialBalance 10 || echo "Account $BETS_CONTRACT may already exist, continuing..."
near create-account "$ORACLE_CONTRACT" --masterAccount "$ACCOUNT_ID" --initialBalance 5 || echo "Account $ORACLE_CONTRACT may already exist, continuing..."

# Deploy contracts
echo "--- Deploying contracts ---"
near deploy "$BETS_CONTRACT" contracts/backyard-bets/build/backyard-bets.wasm
near deploy "$ORACLE_CONTRACT" contracts/oracle/build/oracle.wasm

# Initialize oracle
echo "--- Initializing oracle ---"
near call "$ORACLE_CONTRACT" init '{}' --accountId "$ACCOUNT_ID"

echo ""
echo "=== Deployment complete ==="
echo "Bets contract: $BETS_CONTRACT"
echo "Oracle contract: $ORACLE_CONTRACT"
