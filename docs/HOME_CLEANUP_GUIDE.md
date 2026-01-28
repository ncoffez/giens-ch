# Home Cleanup & Owners Fix Guide

## Overview
This guide helps you:
1. Clean up homes 21-30 (reduce from 30 homes to 20)
2. Fix the Owners dropdown in the admin homes edit page

---

## Part 1: Clean Up Homes 21-30

### Quick Steps

```bash
# Step 1: Login to Firebase
firebase login

# Step 2: Get your Firebase ID token
./scripts/get-token.sh

# Step 3: Run cleanup with the token
./scripts/cleanup-homes.sh <YOUR_TOKEN>

# Example output:
# ✓ Successfully cleaned up homes
# { deleted: 10 }
```

### What the cleanup does:
- Deletes all documents in `homes` collection matching "Haus 21" through "Haus 30"
- Updates `settings/global.maxHomeNumber` to 20
- Deletes homes in batch (atomic operation)

### Manual Verification:
After cleanup, verify in Firebase Console:
```bash
# Check Firestore > homes collection
# Should show only Haus 1 through Haus 20

# Check Firestore > settings > global
# Should have maxHomeNumber: 20
```

### Troubleshooting

**"No token found" error:**
```bash
firebase login:print-token
```

**"Forbidden: Admin access required" error:**
- Your Firebase user needs the `admin` custom claim
- Temporarily add via Firebase Console or use the User Admin page to set yourself as admin

**Endpoint returns 500 error:**
```bash
# Check if dev server is running
npm run dev

# Check logs for errors
tail -f .output/server/logs/*.log 2>/dev/null
```

---

## Part 2: Owners Dropdown Fix

### Issue
Previously, the Owners dropdown (`Eigentümer zuweisen` in `/admin/homes/[id]/edit`) showed no options because:
- The API incorrectly tried to query `db.collection("users")` (non-existent Firestore collection)
- Users are stored in Firebase Authentication, not Firestore

### What was fixed (`server/api/users/owners.get.ts`):
```typescript
// OLD (broken)
const usersRef = db.collection("users"); // ❌ collection doesn't exist
const snapshot = await usersRef.get();

// NEW (fixed)
const allUsersResult = await auth.listUsers(1000); // ✅ Firebase Auth
```

### How to verify the fix:

1. **Deploy the code:**
   ```bash
   npm run build
   npm run deploy
   ```

2. **Test in browser:**
   - Navigate to `/admin/homes`
   - Click "Bearbeiten" (edit button) on any home
   - The "Eigentümer zuweisen" dropdown should now show all users with `owner` or `admin` claims
   - You should see entries like: "John Doe (john@example.com)"

3. **Test the API directly:**
   ```bash
   # Get your token
   TOKEN=$(./scripts/get-token.sh | tail -1)

   # Call the owners endpoint
   curl "http://localhost:3000/api/users/owners" \
     -H "Authorization: Bearer $TOKEN"

   # Expected output: Array of owner objects
   [
     { uid: "...", email: "...", displayName: "..." },
     ...
   ]
   ```

### What if the dropdown still shows no options?

**Check 1: Verify users have owner/admin claims**
```bash
# In Firebase Console:
# Authentication > Users > Click on a user
# Look for "Custom Claims" section
# Should have: { owner: true } or { admin: true }
```

**Check 2: Verify API endpoint works**
```bash
# Test the owners endpoint
curl "http://localhost:3000/api/users/owners" \
  -H "Authorization: Bearer $TOKEN"
```

**Check 3: Verify Vue component data binding**
```bash
# Open browser dev console (F12)
# Navigate to Network tab
# Filter by "owners"
# Click edit on a home
# Look for the API request
# Should have status 200 and return data
```

---

## Part 3: Manual Cleanup (Alternative Method)

If you prefer manual cleanup via Firebase Console:

1. Navigate to Firebase Console: `https://console.firebase.google.com`
2. Select your project (giens-ch)
3. Go to Firestore Database > `homes` collection
4. Select documents with IDs matching "Haus 21" through "Haus 30"
5. Click "Delete" for each selected document (10 total)
6. Go to Firestore Database > `settings` collection > `global` document
7. Edit the `maxHomeNumber` field and change it from `30` to `20`

---

## Verification Checklist

After cleanup, verify:

- [ ] Firebase Firestore `homes` collection has only 20 documents (Haus 1 - Haus 20)
- [ ] Firebase Firestore `settings/global.maxHomeNumber` is set to 20
- [ ] `/admin/homes` page shows only 20 homes in the list
- [ ] Owner dropdown in `/admin/homes/[id]/edit` shows all admin/owner users
- [ ] Can successfully assign an owner to a home via the dropdown
- [ ] Home list shows "Zugewiesen" for assigned homes, "-" for unassigned

---

## Additional Notes

### Default Values Updated:
- `server/utils/homeInit.ts`: Default `maxHomeNumber` changed from 30 → 20
- `server/utils/homes.ts`: Default `maxHomeNumber` changed from 30 → 20
- Future home initialization will default to 20 homes

### Files Changed:
1. `server/api/users/owners.get.ts` - Fixed owners API
2. `server/api/admin/homes/cleanup-surplus.post.ts` - New cleanup endpoint
3. `server/utils/homeInit.ts` - Updated default values
4. `server/utils/homes.ts` - Updated default values
5. `scripts/cleanup-homes.sh` - Helper script for cleanup
6. `scripts/get-token.sh` - Helper script for getting Firebase token

### Related Changes (from earlier):
- `app/pages/admin/homes/index.vue` - Numeric sorting, three-dots menu
- `app/components/admin/users.vue` - Reduced font size
- `server/api/admin/homes/[id]/.get.ts` - New GET endpoint for single home

---

## Support

If any issues arise:
1. Check the browser console for errors
2. Run `npm run dev` and check server logs
3. Verify Firebase Console settings
4. Test API endpoints with curl/Postman