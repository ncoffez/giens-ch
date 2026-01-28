#!/bin/bash

# Script to cleanup surplus homes (21-30)
# Usage: ./scripts/cleanup-homes.sh <firebase-id-token>

if [ -z "$1" ]; then
  echo "Error: Firebase ID token required"
  echo ""
  echo "Usage: ./scripts/cleanup-homes.sh <YOUR_ID_TOKEN>"
  echo ""
  echo "To get your token, run:"
  echo "  firebase login"
  echo ""
  exit 1
fi

TOKEN="$1"
BASE_URL="http://localhost:3000"

echo "Cleaning up homes 21-30..."
echo ""

RESPONSE=$(curl -X POST "${BASE_URL}/api/admin/homes/cleanup-surplus" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Successfully cleaned up homes"
  echo "$BODY"
else
  echo "✗ Cleanup failed (HTTP $HTTP_CODE)"
  echo "$BODY"
fi