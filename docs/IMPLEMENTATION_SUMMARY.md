# Implementation Summary

## Changes Made

### 1. Fixed Owners Dropdown (Fixed API Query)
**File:** `server/api/users/owners.get.ts`
- **Issue:** Was querying non-existent Firestore `users` collection
- **Fix:** Changed to use `auth.listUsers(1000)` from Firebase Authentication
- **Result:** Owners dropdown in `/admin/homes/[id]/edit` will now populate with all users having `owner` or `admin` claims

### 2. Cleanup Endpoint Created
**File:** `server/api/admin/homes/cleanup-surplus.post.ts` (new)
- **Purpose:** Delete homes 21-30 and set maxHomeNumber to 20
- **Usage:** Called via button in admin homes page
- **Features:** Batch delete, updates settings

### 3. Bootstrap Endpoint Created (First Admin Setup)
**File:** `server/api/admin/bootstrap-first-admin.post.ts` (new)
- **Purpose:** Set first user as admin (solves chicken-and-egg problem)
- **Security:** Requires `BOOTSTRAP_SECRET` from `.env`
- **Usage:** Via `scripts/bootstrap-admin.sh` helper script
- **Generated Secret:** Included in `.env` file (save this securely!)

### 4. Cleanup Button Added to Admin Homes Page
**File:** `app/pages/admin/homes/index.vue`
- **Button Location:** New warning card at top of page
- **Visibility:** Only shown when homes 21-30 exist
- **Features:**
  - Shows warning message about surplus homes
  - "Häuser 21-30 löschen" button
  - Confirmation dialog before deletion
  - Loading state during cleanup
  - Success/error toast messages

### 5. Helper Scripts Created
**Files:**
- `scripts/cleanup-homes.sh` - Executes cleanup with token
- `scripts/get-token.sh` - Gets Firebase ID token
- `scripts/bootstrap-admin.sh` - Bootstraps first admin

### 6. News Hover Effects Updated
**File:** `app/components/ui/summary.vue`
- **Date:** Adding hover `bg-neutral-100/50` (neutral background)
- **Author:** Adding hover `bg-neutral-100/50` + `text-primary`
- **"Lesen":** Adding hover `bg-primary/5` + `text-primary/80`
- **All:** Rounded pill shape `rounded-full px-2 py-0.5`

### 7. Default Home Count Updated
**Files:** `server/utils/homeInit.ts`, `server/utils/homes.ts`
- Changed default from 30 → 20 homes
- Future initialization defaults to 20 homes

### 8. Documentation Created
**File:** `docs/HOME_CLEANUP_GUIDE.md` (new)
- Complete guide for cleanup and owners fix
- Troubleshooting section

---

## How to Use Each Feature

### Set Up First Admin (Bootstrap)

```bash
# Step 1: Generate token
./scripts/get-token.sh | tail -1

# Step 2: Run bootstrap
TOKEN=<your-token-from-step-1>
./scripts/bootstrap-admin.sh $TOKEN

# Expected output:
# ✓ Successfully set up first admin user
# You can now access the Admin UI at: http://localhost:3000/admin/users
```

### Clean Up Homes 21-30

**Option A: Via Admin UI (Recommended)**
1. Navigate to `/admin/homes`
2. You'll see a warning card about surplus homes (only if homes 21-30 exist)
3. Click "Häuser 21-30 löschen" button
4. Confirm in dialog
5. Success message: "Erfolgreich 10 Häuser gelöscht"

**Option B: Via Script**
```bash
TOKEN=$(./scripts/get-token.sh | tail -1)
./scripts/cleanup-homes.sh $TOKEN
```

### Use Owners Dropdown

1. After bootstrap, log in as admin
2. Navigate to `/admin/homes/[id]/edit` for any home
3. "Eigentümer zuweisen" dropdown now shows all users with `owner` or `admin` claims
4. Assign an owner to test

---

## Visual Changes Preview

### Before
```
/admin/homes page:
- 30 homes listed (Haus 1 - Haus 30)
- No cleanup button
- 3 aktiv · 27 deaktiviert (when showing disabled)

/admin/homes/[id]/edit:
- Owners dropdown empty (no options selected)

/news page:
- Date: Plain text, no hover effect
- Author: Changes to primary color on hover, no background
- "Lesen": Shows on hover, no background

```

### After
```
/admin/homes page:
- Warning card at top: "Überschüssige Häuser vorhanden" (if homes 21-30 exist)
- Cleanup button: "Häuser 21-30 löschen"
- After cleanup: 20 homes (Haus 1 - Haus 20)
- 3 aktiv · 17 deaktiviert

/admin/homes/[id]/edit:
- Owners dropdown shows admin/owner users
- Can assign owners

/news page:
- Date: Hover shows `bg-neutral-100/50` (light gray pill)
- Author: Hover shows `bg-neutral-100/50` + `text-primary`
- "Lesen": Hover shows `bg-primary/5` + text-opacity-change
```

---

## Bootstrap Secret

The bootstrap secret has been added to `.env`:

```
BOOTSTRAP_SECRET='BBxwAvr3sUHbh4w0I8TtOO5SBXdCJ7TC76KEucLYwB0='
```

**IMPORTANT:** Save this secret somewhere safe! Without it, you cannot bootstrap the first admin. If lost, regenerate a new one with:

```bash
openssl rand -base64 32
```

---

## Files Changed Summary

| Category | File | Status | Purpose |
|----------|------|--------|---------|
| **API Endpoints** | `server/api/users/owners.get.ts` | Modified | Fix owners dropdown (Firebase Auth) |
| | `server/api/admin/bootstrap-first-admin.post.ts` | New | Bootstrap first admin |
| | `server/api/admin/homes/cleanup-surplus.post.ts` | New | Cleanup homes 21-30 |
| **Frontend Pages** | `app/pages/admin/homes/index.vue` | Modified | Cleanup button UI |
| | `app/components/admin/users.vue` | Modified | Font size change (earlier) |
| | `app/components/ui/summary.vue` | Modified | News hover effects |
| **Backend Utils** | `server/utils/homeInit.ts` | Modified | Default 20 homes |
| | `server/utils/homes.ts` | Modified | Default 20 homes |
| | `server/api/admin/homes/[id]/.get.ts` | New | GET single home (earlier) |
| **Helper Scripts** | `scripts/cleanup-homes.sh` | New | Cleanup automation |
| | `scripts/get-token.sh` | New | Get Firebase token |
| | `scripts/bootstrap-admin.sh` | New | Bootstrap automation |
| **Documentation** | `.env` | Modified | Added BOOTSTRAP_SECRET |
| | `docs/HOME_CLEANUP_GUIDE.md` | New | Complete guide |

---

## Test Results
- ✅ All 118 tests pass
- ✅ Build successful
- ✅ Dev server running (http://localhost:3000)

---

## Next Steps for You

1. **Run cleanup** (delete homes 21-30):
   - Visit `/admin/homes` in browser
   - Click "Häuser 21-30 löschen" button
   
   OR run manually:
   ```bash
   TOKEN=$(./scripts/get-token.sh | tail -1)
   ./scripts/cleanup-homes.sh $TOKEN
   ```

2. **Bootstrap first admin** (if not already admin):
   ```bash
   TOKEN=$(./scripts/get-token.sh | tail -1)
   ./scripts/bootstrap-admin.sh $TOKEN
   ```

3. **Verify after bootstrap**:
   - Visit `/admin/users`
   - You should see role badges (Admin, etc.)
   - Set other users as owner/admin as needed

4. **Verify cleanup**:
   - Visit `/admin/homes`
   - Should show 20 homes (Haus 1 - Haus 20)
   - Check "Deaktivierte Häuser anzeigen" switch
   - Should show "3 aktiv · 17 deaktiviert"

5. **Deploy when ready**:
   ```bash
   npm run build
   npm run deploy
   ```

---

## Notes

- The cleanup and bootstrap scripts are in `/scripts/` directory
- All changes are ready for deployment
- The `BOOTSTRAP_SECRET` should be treated as sensitive
- After deploying, update your Firebase functions for the new endpoints