import 'dotenv/config';
import admin from 'firebase-admin';
import { existsSync } from 'fs';

console.log('Setting up Firebase Admin SDK...');

if (!existsSync('.env')) {
    console.error('ERROR: .env file not found');
    process.exit(1);
}

const { FIREBASE_ADMIN_KEY } = process.env;

if (!FIREBASE_ADMIN_KEY) {
    console.error('ERROR: FIREBASE_ADMIN_KEY not found in .env');
    process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = JSON.parse(FIREBASE_ADMIN_KEY);
} catch (e) {
    console.error('ERROR: Failed to parse FIREBASE_ADMIN_KEY as JSON');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateArticleAttachments() {
    try {
        console.log('\nFetching articles from Firestore...');
        const articlesSnapshot = await db.collection('articles').get();
        console.log(`Found ${articlesSnapshot.size} articles total.`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const doc of articlesSnapshot.docs) {
            const data = doc.data();
            const body = data.body || "";
            const hasAttachmentsAttr = data.hasAttachments;
            
            // Detection logic
            const containsDocLinks = body.includes('class="document-link"');
            
            // Only update if the attribute is missing or incorrect
            if (hasAttachmentsAttr === containsDocLinks) {
                skippedCount++;
                continue;
            }

            try {
                await db.collection('articles').doc(doc.id).update({
                    hasAttachments: containsDocLinks,
                    updatedAt: new Date().toISOString()
                });
                updatedCount++;
                console.log(`   ✓ Updated article ${doc.id} (hasAttachments: ${containsDocLinks})`);
            } catch (err) {
                errorCount++;
                console.error(`   ✗ Failed to update article ${doc.id}:`, err);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('Migration complete!');
        console.log(`   ✅ ${updatedCount} articles updated`);
        console.log(`   ⏭  ${skippedCount} articles already up to date`);
        console.log(`   ❌ ${errorCount} errors`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateArticleAttachments();
