import 'dotenv/config';

import admin from 'firebase-admin';
import { existsSync } from 'fs';

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
console.log('Starting article authorUid migration...');
console.log('='.repeat(60));

async function migrateArticleAuthorUids() {
    try {
        // Step 1: Get all users with their UIDs and display names/emails
        console.log('\n[1/5] Fetching all users from Firebase Auth...');
        const allUsersResult = await auth.listUsers(1000);
        const usersMap = new Map<string, string>(); // Lowercase displayName/email -> UID

        allUsersResult.users.forEach((user) => {
            const displayName = user.displayName?.toLowerCase().trim() || "";
            const email = user.email?.toLowerCase().trim() || "";

            // Author field can be either display name or email
            if (displayName) {
                usersMap.set(displayName, user.uid);
            }
            if (email) {
                usersMap.set(email, user.uid);
            }
        });

        console.log(`   Found ${allUsersResult.users.length} users in Firebase Auth`);
        console.log(`   Built lookup map with ${usersMap.size} entries`);

        // Step 2: Find all articles without authorUid
        console.log('\n[2/5] Finding articles without authorUid...');
        const articlesSnapshot = await db.collection('articles').get();
        const articlesToMigrate: Array<{ id: string; author: string; title: string }> = [];

        articlesSnapshot.forEach((doc) => {
            const data = doc.data();
            const author = data.author;
            const authorUid = data.authorUid;

            // Skip if authorUid already exists
            if (authorUid) return;

            // Skip if no author field
            if (!author) {
                console.log(`   ⚠ Skipping article ${doc.id}: no author field`);
                return;
            }

            articlesToMigrate.push({
                id: doc.id,
                author: author,
                title: data.title || "Untitled"
            });
        });

        console.log(`   Found ${articlesToMigrate.length} articles to migrate`);

        if (articlesToMigrate.length === 0) {
            console.log('\n✅ No articles need migration. All done!');
            process.exit(0);
        }

        // Step 3: Match authors to user UIDs
        console.log('\n[3/5] Matching authors to Firebase Auth users...');
        const migrationMap = new Map<string, string>(); // article ID -> UID

        articlesToMigrate.forEach((article) => {
            const authorLower = article.author.toLowerCase().trim();
            const matchedUid = usersMap.get(authorLower);

            if (matchedUid) {
                migrationMap.set(article.id, matchedUid);
                console.log(`   ✓ Article "${article.title}" (id: ${article.id}) -> UID: ${matchedUid}`);
            } else {
                console.log(`   ✗ No match for author "${article.author}" in article "${article.title}"`);
            }
        });

        console.log(`   Matched ${migrationMap.size} / ${articlesToMigrate.length} articles`);

        if (migrationMap.size === 0) {
            console.log('\n⚠ Unable to match any articles. Make sure author names match Firebase Auth user display names/emails.');
            process.exit(0);
        }

        // Step 4: Confirm migration
        console.log('\n[4/5] Confirming migration...');
        console.log(`   About to update ${migrationMap.size} articles with authorUid`);

        // Step 5: Apply migration
        console.log('\n[5/5] Applying migration...');
        let migratedCount = 0;
        let errorCount = 0;

        for (const [articleId, uid] of migrationMap) {
            try {
                await db.collection('articles').doc(articleId).update({
                    authorUid: uid,
                    updatedAt: new Date().toISOString()
                });
                migratedCount++;
                console.log(`   ✓ Updated article ${articleId}`);
            } catch (error) {
                errorCount++;
                console.error(`   ✗ Failed to update article ${articleId}:`, error);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('Migration complete!');
        console.log(`   ✅ ${migratedCount} articles updated`);
        console.log(`   ❌ ${errorCount} errors`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateArticleAuthorUids()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });