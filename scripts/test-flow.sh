#!/bin/bash
set -e

# Test the full betting flow on NEAR testnet
# Usage: bash scripts/test-flow.sh <your-account.testnet>

ACCOUNT_ID=${1:?"Usage: bash scripts/test-flow.sh <your-account.testnet>"}
BETS_CONTRACT="bets.${ACCOUNT_ID}"
ORACLE_CONTRACT="oracle.${ACCOUNT_ID}"

echo "=== Testing Backyard Bets Flow ==="
echo ""

# 1. Create a party
echo "--- Step 1: Create a party ---"
near call "$BETS_CONTRACT" create_party '{"name": "Super Bowl Party"}' --accountId "$ACCOUNT_ID"

# 2. Get parties to find the ID
echo ""
echo "--- Step 2: List parties ---"
near view "$BETS_CONTRACT" get_parties '{}'

# Note: Copy the party ID from the output above and use it below
# For automated testing, you'd parse the JSON output

echo ""
echo "=== Manual next steps ==="
echo "1. Copy the party ID from the output above"
echo "2. Create a bet:"
echo "   near call $BETS_CONTRACT create_bet '{\"party_id\": \"<PARTY_ID>\", \"event_id\": \"nba-lakers-celtics-2025\", \"description\": \"Lakers vs Celtics - Winner\", \"options\": [\"Lakers\", \"Celtics\"], \"deadline\": \"1739500000000000000\"}' --accountId $ACCOUNT_ID"
echo ""
echo "3. Place a wager (attach NEAR):"
echo "   near call $BETS_CONTRACT place_wager '{\"bet_id\": \"<BET_ID>\", \"option_index\": 0}' --accountId $ACCOUNT_ID --deposit 1"
echo ""
echo "4. Settle the bet:"
echo "   near call $BETS_CONTRACT settle_bet '{\"bet_id\": \"<BET_ID>\", \"winning_option\": 0}' --accountId $ACCOUNT_ID"
echo ""
echo "5. Check wagers:"
echo "   near view $BETS_CONTRACT get_wagers_for_bet '{\"bet_id\": \"<BET_ID>\"}'"
