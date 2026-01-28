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
    console.error('ERROR: FIREBASE_ADMIN_KEY not found');
    process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = JSON.parse(FIREBASE_ADMIN_KEY);
} catch (e) {
    console.error('ERROR: Failed to parse FIREBASE_ADMIN_KEY');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function verifyUserArticles() {
    try {
        // Get all articles
        console.log('\nFetching all articles...');
        const articlesSnapshot = await db.collection('articles').get();
        const totalArticles = articlesSnapshot.docs.length;

        // Get all users
        console.log('Fetching all users...');
        const allUsers = await admin.auth().listUsers(1000);
        const usersMap = new Map<string, { uid: string; displayName: string; email: string }>();

        allUsers.users.forEach((user) => {
            if (user.email) {
                usersMap.set(user.email.toLowerCase(), {
                    uid: user.uid,
                    displayName: user.displayName || user.email.toLowerCase(),
                    email: user.email.toLowerCase()
                });
            }
        });

        console.log(`\nFound ${totalArticles} articles and ${usersMap.size} users`);

        const linkedByUid: { id: string; title: string; authorUid: string; author: string }[] = [];
        const linkedByName: { id: string; title: string; author: string; suggestedUid?: string }[] = [];
        const unlinked: { id: string; title: string; author: string }[] = [];

        articlesSnapshot.forEach((doc) => {
            const data = doc.data();
            const article = {
                id: doc.id,
                title: data.title || 'Untitled',
                author: data.author || 'No author',
                authorUid: data.authorUid || null
            };

            if (article.authorUid) {
                const user = Array.from(usersMap.values()).find(u => u.uid === article.authorUid);
                if (user) {
                    linkedByUid.push({ ...article, author: user.displayName });
                } else {
                    console.log(`  ⚠ Article ${article.id}: authorUid "${article.authorUid}" not found in users`);
                }
            } else if (article.author) {
                const user = Array.from(usersMap.values()).find(u =>
                    u.displayName.toLowerCase() === article.author.toLowerCase() ||
                    u.email.toLowerCase() === article.author.toLowerCase()
                );
                if (user) {
                    linkedByName.push({
                        ...article,
                        suggestedUid: user.uid
                    });
                } else {
                    unlinked.push(article);
                }
            } else {
                unlinked.push(article);
            }
        });

        console.log('\n=== Data Integrity Report ===');
        console.log(`Total articles: ${totalArticles}`);
        console.log(`Linked by UID: ${linkedByUid.length}`);
        console.log(`Linked by name: ${linkedByName.length}`);
        console.log(`Unlinked: ${unlinked.length}`);

        if (linkedByName.length > 0) {
            console.log('\n=== Articles Linked by Name (Suggested Fixes) ===');
            linkedByName.forEach(article => {
                console.log(`  ${article.title} (${article.id})`);
                console.log(`    Author: ${article.author}`);
                console.log(`    Suggested authorUid: ${article.suggestedUid}`);
                console.log(`    Fix: db.collection('articles').doc('${article.id}').update({ authorUid: '${article.suggestedUid}' })`);
                console.log('');
            });
        }

        if (unlinked.length > 0) {
            console.log('\n=== Unlinked Articles (No Match Found) ===');
            unlinked.forEach(article => {
                console.log(`  ${article.title} (${article.id})`);
                console.log(`    Author: ${article.author}`);
            });
        }

        console.log('\n=== Suggested Fixes ===');
        if (linkedByName.length > 0) {
            console.log(`Run the following to fix ${linkedByName.length} articles:`);
            linkedByName.forEach(article => {
                console.log(`  db.collection('articles').doc('${article.id}').update({ authorUid: '${article.suggestedUid}' });`);
            });
            console.log('');
        }

    } catch (error) {
        console.error('Verification error:', error);
        process.exit(1);
    }
}

verifyUserArticles()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });