#!/bin/bash

# Bootstrap the first admin user
# Usage: ./scripts/bootstrap-admin.sh <firebase-id-token>

set -e

if [ -z "$1" ]; then
  echo "Error: Firebase ID token required"
  echo ""
  echo "Usage: ./scripts/bootstrap-admin.sh <YOUR_ID_TOKEN>"
  echo ""
  echo "To get your token:"
  echo "  1. Run: firebase login"
  echo "  2. Run: firebase login:print-token"
  echo "  3. Copy the output and paste it here"
  exit 1
fi

TOKEN="$1"
BASE_URL="http://localhost:3000"

echo "Checking for BOOTSTRAP_SECRET..."
if [ -z "$BOOTSTRAP_SECRET" ]; then
  if [ -f ".env" ]; then
    source .env
  fi
fi

if [ -z "$BOOTSTRAP_SECRET" ]; then
  echo "Error: BOOTSTRAP_SECRET environment variable not set."
  echo ""
  echo "Please add this to your .env file:"
  BOOTSTRAP_SECRET=$(openssl rand -base64 32 2>/dev/null)
  echo "BOOTSTRAP_SECRET=${BOOTSTRAP_SECRET}"
  echo ""
  echo "Add this line to .env file, then run this script again."
  echo ""
  echo "Note: Save this secret somewhere safe - you'll need it to bootstrap."
  exit 1
fi

echo "Bootstrapping first admin user..."
echo ""

RESPONSE=$(curl -X POST "${BASE_URL}/api/admin/bootstrap-first-admin" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Secret: ${BOOTSTRAP_SECRET}" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Successfully set up first admin user"
  echo "$BODY"
  echo ""
  echo "You can now access the Admin UI at: ${BASE_URL}/admin/users"
  echo "Use that interface to manage roles for other users."
else
  echo "✗ Bootstrap failed (HTTP $HTTP_CODE)"
  echo "$BODY"
  echo ""
  echo "Troubleshooting:"
  echo "  - Check that you have a valid Firebase ID token"
  echo "  - Verify BOOTSTRAP_SECRET matches in .env file"
  echo "  - Ensure dev server is running: npm run dev"
  exit 1
fi