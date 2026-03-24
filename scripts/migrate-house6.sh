#!/bin/bash

# Run the House 6 migration
# Requires: FIREBASE_ADMIN_KEY in .env file

echo "Running House 6 Migration..."
echo ""

node scripts/migrate-house6.mjs
