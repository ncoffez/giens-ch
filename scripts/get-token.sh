#!/bin/bash

# Get Firebase ID token for Admin API calls
# Usage: ./scripts/get-token.sh

echo "Getting Firebase ID token..."
echo ""

TOKEN=$(firebase login:print-token 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "Error: No token found. Please run 'firebase login' first."
  exit 1
fi

echo "Your Firebase ID Token:"
echo ""
echo "$TOKEN"
echo ""
echo "Usage: ./scripts/cleanup-homes.sh $TOKEN"