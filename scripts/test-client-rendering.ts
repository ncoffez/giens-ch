import 'dotenv/config';

import admin from 'firebase-admin';
import { existsSync } from 'fs';

console.log('=== Client-Side Rendering Test ===\n');

if (!existsSync('.env')) {
    console.error('ERROR: .env file not found');
    process.exit(1);
}

const { FIREBASE_ADMIN_KEY, NUXT_PUBLIC_API_BASE_URL = 'http://localhost:3000' } = process.env;

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
const auth = admin.auth();

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (e: any) {
        clearTimeout(id);
        if (e.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        throw e;
    }
}

async function main() {
    try {
        const allUsers = await auth.listUsers(1000);
        const user = allUsers.users.find(u => u.email === 'ncoffez@gmail.com');

        if (!user) {
            console.error('ERROR: User ncoffez@gmail.com not found');
            process.exit(1);
        }

        const uid = user.uid;
        console.log(`[1/7] Testing public profile for: ${user.displayName} (${user.email})`);
        console.log(`UID: ${uid}\n`);

        const profileUrl = `${NUXT_PUBLIC_API_BASE_URL}/api/profile/${uid}`;
        console.log(`[2/7] Fetching public profile: ${profileUrl}`);

        const response = await fetchWithTimeout(profileUrl, { method: 'GET' });
        console.log(`Response status: ${response.status}`);

        if (response.status !== 200) {
            console.error('❌ FAILED: Public profile API returned non-200 status');
            process.exit(1);
        }

        const data = await response.json();

        console.log('\n[3/7] Checking response structure...');

        const checks: { name: string; passed: boolean; details: string }[] = [];

        checks.push({
            name: 'Has displayName',
            passed: !!data.displayName,
            details: data.displayName || 'Missing'
        });

        checks.push({
            name: 'Has photoURL',
            passed: !!data.photoURL,
            details: data.photoURL ? 'Present' : 'Missing'
        });

        checks.push({
            name: 'Has articles array',
            passed: Array.isArray(data.articles),
            details: Array.isArray(data.articles) ? `Array of ${data.articles.length} items` : 'Not an array'
        });

        if (checks.some(c => !c.passed)) {
            console.log('❌ FAILED: Response structure is incomplete');
            checks.forEach(c => {
                if (!c.passed) {
                    console.log(`   - ${c.name}: ${c.details}`);
                }
            });
            process.exit(1);
        }

        console.log('✅ Response structure is valid');

        console.log(`\n[4/7] Verifying articles count...`);
        console.log(`   Articles found: ${data.articles.length}`);

        if (data.articles.length === 0) {
            console.log('❌ FAILED: No articles in response');
            console.log('   Page will show "Noch keine Beiträge veröffentlicht."');
            process.exit(1);
        }

        console.log('✅ Articles array has data');

        console.log(`\n[5/7] Checking article data completeness...`);
        const firstArticle = data.articles[0];
        const requiredFields = ['id', 'title', 'intro', 'image', 'published'];
        const missingFields = requiredFields.filter(field => !firstArticle[field]);

        if (missingFields.length > 0) {
            console.log('❌ FAILED: Article data is incomplete');
            console.log(`   Missing fields: ${missingFields.join(', ')}`);
            process.exit(1);
        }

        console.log('✅ Article data is complete');
        console.log('   Sample article object:', JSON.stringify(firstArticle, null, 2));

        console.log(`\n[6/7] Simulating client-side rendering conditions...`);

        const templateChecks: { condition: string; passed: boolean; details: string }[] = [];

        templateChecks.push({
            condition: 'profile exists (v-if="profile")',
            passed: true,
            details: data ? 'Yes' : 'No'
        });

        templateChecks.push({
            condition: 'profile.articles exists (v-if="profile.articles")',
            passed: !!data.articles,
            details: data.articles ? 'Yes' : 'No'
        });

        templateChecks.push({
            condition: 'articles.length > 0 (v-if="profile.articles.length > 0")',
            passed: (data.articles?.length || 0) > 0,
            details: `Length: ${data.articles?.length || 0}`
        });

        const failedChecks = templateChecks.filter(c => !c.passed);

        if (failedChecks.length > 0) {
            console.log('❌ FAILED: Template conditions not met');
            failedChecks.forEach(c => {
                console.log(`   - ${c.condition}: ${c.details}`);
            });
            console.log('\n   Result: "Noch keine Beiträge veröffentlicht." will be shown');
            process.exit(1);
        }

        console.log('✅ All template conditions passed');
        console.log('   Result: Articles will be displayed');

        console.log(`\n[7/7] Firebase data consistency check...`);
        const db = admin.firestore();
        const dbArticles = await db.collection('articles')
            .where('authorUid', '==', uid)
            .get();

        console.log(`   Firebase: ${dbArticles.docs.length} articles`);
        console.log(`   API: ${data.articles.length} articles`);

        if (dbArticles.docs.length !== data.articles.length) {
            console.log('❌ FAILED: API and Firebase counts don\'t match');
            process.exit(1);
        }

        console.log('✅ API and Firebase are consistent');

        console.log('\n\n=== VERIFICATION COMPLETE ===');
        console.log('✅ All checks passed');
        console.log('\nClient-side rendering SHOULD work correctly:');
        console.log(`  - Name will show: ${data.displayName}`);
        console.log(`  - Photos will load: ${data.photoURL ? 'Yes' : 'No'}`);
        console.log(`  - Articles will display: ${data.articles.length} items`);
        console.log(`  - First article: ${data.articles[0]?.title || 'N/A'}`);
        console.log('\nIf the page still shows "Noch keine Beiträge veröffentlicht.",');
        console.log('the issue is client-side caching or hydration.');
        console.log('\nTroubleshooting steps:');
        console.log('1. Clear browser cache and cookies');
        console.log('2. Check browser console for JavaScript errors');
        console.log('3. Check if profile?.articles is actually populated in console logs');
        console.log('4. Verify template v-if="profile.articles && profile.articles.length > 0" is evaluated correctly');

        console.log('\n=== END ===');

    } catch (error: any) {
        console.error('\n❌ Verification failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });