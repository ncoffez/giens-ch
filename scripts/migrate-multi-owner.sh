#!/bin/bash

# Migrate homes from single-owner (ownerId) to multi-owner (ownerIds)
# This also syncs owner claims to ensure only actual home owners have the owner claim
# Usage: ./scripts/migrate-multi-owner.sh <firebase-id-token>

set -e

if [ -z "$1" ]; then
  echo "Error: Firebase ID token required"
  echo ""
  echo "Usage: ./scripts/migrate-multi-owner.sh <YOUR_ID_TOKEN>"
  echo ""
  echo "To get your token:"
  echo "  1. Run: firebase login"
  echo "  2. Run: firebase login:print-token"
  echo "  3. Copy the output and paste it here"
  exit 1
fi

TOKEN="$1"
BASE_URL="http://localhost:3000"

echo "Starting migration to multi-owner support..."
echo ""

RESPONSE=$(curl -X POST "${BASE_URL}/api/admin/homes/migrate-multi-owner" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Migration completed successfully"
  echo "$BODY" | jq -r '
    if .status == "success" then
      "- Migrated \(.migratedHomes) homes",
      "- Granted owner claim to \(.grantedClaims) users",
      "- Revoked owner claim from \(.revokedClaims) users",
      (if .errors then (.errors | map("Error: \(.[])")) | .[] else empty end)
    else
      .message
    end
  '
  echo ""
  echo "You can now:"
  echo "  - Assign multiple owners to each home"
  echo "  - View stacked avatars for multiple owners in the admin table"
  echo "  - Hover over single owners to see their profile card"
else
  echo "✗ Migration failed (HTTP $HTTP_CODE)"
  echo "$BODY"
  exit 1
fi