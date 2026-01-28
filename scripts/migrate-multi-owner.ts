import 'dotenv/config';

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';

console.log('Setting up Firebase Admin SDK...');

// Load environment and admin key
if (!existsSync('.env')) {
    console.error('ERROR: .env file not found in current directory');
    process.exit(1);
}

const { FIREBASE_ADMIN_KEY } = process.env;

if (!FIREBASE_ADMIN_KEY) {
    console.error('ERROR: FIREBASE_ADMIN_KEY environment variable not found in .env');
    console.log('');
    console.log('Please ensure your .env file contains:');
    console.log('  FIREBASE_ADMIN_KEY=\'{...service_account_key_json...}\'');
    console.log('');
    console.log('The migration cannot proceed without Firebase Admin credentials.');
    process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = JSON.parse(FIREBASE_ADMIN_KEY);
} catch (e) {
    console.error('ERROR: Failed to parse FIREBASE_ADMIN_KEY as JSON');
    console.error('Please ensure FIREBASE_ADMIN_KEY contains valid JSON');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

console.log('Firebase Admin initialized successfully');
console.log('');
console.log('Starting migration to multi-owner support...');

const stats = {
    migratedHomes: 0,
    grantedClaims: 0,
    revokedClaims: 0,
    errors: [] as string[]
};

try {
    // Build owner set from all homes
    console.log('Fetching homes from database...');
    const allHomesSnapshot = await db.collection('homes').get();
    const allOwners = new Set<string>();

    allHomesSnapshot.forEach((doc: any) => {
        const ownerIds = doc.data().ownerIds;
        if (ownerIds) {
            ownerIds.forEach((id: string) => {
                allOwners.add(id);
            });
        }
    });

    // Migrate each home
    const homesCount = allHomesSnapshot.docs.length;
    console.log(`Found ${homesCount} homes in database`);

    let migratedCount = 0;
    const migrationErrors: string[] = [];

    for (const doc of allHomesSnapshot.docs) {
        const homeData = doc.data();
        const ownerId = homeData.ownerId;
        const ownerIds = homeData.ownerIds;

        // If ownerId exists AND ownerIds doesn't exist, convert it
        if (ownerId !== undefined && (!ownerIds || ownerIds === undefined)) {
            const newOwnerIds = ownerId && ownerId !== '' ? [ownerId] : [];
            await db.collection('homes').doc(doc.id).update({
                ownerIds: newOwnerIds,
                ownerId: ""
            });
            migratedCount++;
            console.log(`  ✓ Migrated home ${doc.id}: ${ownerId} → [${ownerId}]`);
        }
        // Remove stale ownerId if ownerIds already exists
        else if (ownerId !== undefined && ownerIds !== undefined) {
            await db.collection('homes').doc(doc.id).update({
                ownerId: ""
            });
        }
    }

    stats.migratedHomes = migratedCount;

    if (migratedCount === 0) {
        console.log('  No homes needed migration');
    } else {
        console.log(`  Migrated ${migratedCount} homes to multi-owner format`);
    }

    // Sync owner claims
    console.log('');
    console.log('Syncing owner claims...');
    const allUsers = await auth.listUsers(1000);
    let granted = 0;
    let revoked = 0;
    const errors: string[] = [];

    for (const user of allUsers.users) {
        try {
            const claims = user.customClaims || {};
            const isClaimed = claims.owner;
            const shouldBeOwner = allOwners.has(user.uid);

            if (shouldBeOwner && !isClaimed) {
                await auth.setCustomUserClaims(user.uid, { ...claims, owner: true });
                granted++;
                console.log(`  ✓ Granted owner claim to ${user.uid}`);
            } else if (!shouldBeOwner && isClaimed) {
                if (claims.owner) {
                    const { owner, ...remainingClaims } = claims;
                    await auth.setCustomUserClaims(user.uid, remainingClaims);
                    revoked++;
                    console.log(`  ✓ Revoked owner claim from ${user.uid}`);
                }
            }
        } catch (e: any) {
            const errorMsg = `Failed to sync claims for ${user.uid}: ${e.message}`;
            errors.push(errorMsg);
            console.error(`  ✗ ${errorMsg}`);
            throw new Error(errorMsg);
        }
    }

    stats.grantedClaims = granted;
    stats.revokedClaims = revoked;
    stats.errors = errors;

    if (errors.length > 0) {
        console.error('Error: Claim sync errors occurred');
        console.error(`Errors: ${JSON.stringify(errors)}`);
        throw new Error('Claim sync errors occurred');
    }

    console.log(`  Granted owner claim to ${granted} users`);
    console.log(`  Revoked owner claim from ${revoked} users`);

    // Verification report
    console.log('');
    console.log('--- Migration Report ---');
    console.log(`Status: Success`);
    console.log(`Migrated Homes: ${migratedCount}`);
    console.log(`Granted Owner Claims: ${granted}`);
    console.log(`Revoked Owner Claims: ${revoked}`);

    if (migrationErrors.length > 0 || errors.length > 0) {
        console.log('');
        console.log(`Errors: ${migrationErrors.length + errors.length}`);
        if (migrationErrors.length > 0) {
            migrationErrors.forEach((err) => {
                console.log(`  - ${err}`);
            });
        }
        if (errors.length > 0) {
            errors.forEach((err) => {
                console.log(`  - ${err}`);
            });
        }
    }

    console.log('');
    console.log('✓ Migration completed successfully');
    console.log('');
    console.log('You can now:');
    console.log('  - Assign multiple owners to each home');
    console.log('  - View stacked avatars for multiple owners in the admin table');
    console.log('  - Hover over single owners to see their profile card');

} catch (error: any) {
    console.error('');
    console.error('✗ Migration failed');
    console.error('');
    console.error('Error Details:');
    console.error(error.message || error.stack || JSON.stringify(error));
    throw error;
}