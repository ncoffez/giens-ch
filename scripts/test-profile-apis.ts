import 'dotenv/config';

import admin from 'firebase-admin';
import { existsSync } from 'fs';

console.log('=== Profile API Testing ===');
console.log('This script tests profile-related API endpoints\n');

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

// Firebase Admin for getting user UID
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const auth = admin.auth();

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

async function testEndpoint(name: string, url: string, options: RequestInit = {}) {
    console.log(`\n--- ${name} ---`);
    console.log(`URL: ${url}`);
    
    try {
        const response = await fetchWithTimeout(url, options);
        const contentType = response.headers.get('content-type');
        
        console.log(`Status: ${response.status}`);
        console.log(`Content-Type: ${contentType || 'none'}`);
        
        if (contentType?.includes('application/json')) {
            const data = await response.json();
            console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
            return { status: response.status, data, ok: response.ok };
        } else {
            const text = await response.text();
            console.log('Response:', text.substring(0, 500));
            return { status: response.status, text, ok: response.ok };
        }
    } catch (e: any) {
        console.error('Error:', e.message);
        return { status: 0, error: e.message, ok: false };
    }
}

async function main() {
    try {
        // Get your user UID
        console.log('\n[1/5] Getting user UID from Firebase Auth...');
        const allUsers = await auth.listUsers(1000);
        const user = allUsers.users.find(u => u.email === 'ncoffez@gmail.com');
        
        if (!user) {
            console.error('ERROR: User ncoffez@gmail.com not found in Firebase Auth');
            process.exit(1);
        }
        
        const uid = user.uid;
        console.log(`Found UID: ${uid}`);
        console.log(`Display Name: ${user.displayName}`);
        console.log(`Email: ${user.email}`);

        // Test 1: Public profile API
        console.log('\n\n=== Test 1: Public Profile API ===');
        const publicProfile = await testEndpoint(
            'Get Public Profile',
            `${NUXT_PUBLIC_API_BASE_URL}/api/profile/${uid}`,
            { method: 'GET' }
        );

        console.log('\nAnalysis:', 
            publicProfile.ok && publicProfile.data ? 
            `✓ Public profile returned data` : 
            `✗ Public profile failed`
        );
        
        if (publicProfile.ok && publicProfile.data?.articles) {
            console.log(`Articles returned: ${publicProfile.data.articles.length}`);
            if (publicProfile.data.articles.length > 0) {
                console.log('First article:', JSON.stringify(publicProfile.data.articles[0], null, 2));
            } else {
                console.log('⚠ WARNING: API returned empty articles array');
            }
        }

        // Test 2: Private profile API (without auth)
        console.log('\n\n=== Test 2: Private Profile API (No Auth) ===');
        const privateProfileNoAuth = await testEndpoint(
            'Get Private Profile (Unauthenticated)',
            `${NUXT_PUBLIC_API_BASE_URL}/api/profile/articles?page=1`,
            { method: 'GET' }
        );

        console.log('\nAnalysis:');
        if (privateProfileNoAuth.status === 401) {
            console.log('✓ Correctly returns 401 for unauthenticated request');
        } else {
            console.log(`✗ Expected 401, got ${privateProfileNoAuth.status}`);
        }

        // Test 3: Private profile API (with auth - simulate)
        console.log('\n\n=== Test 3: Health Check (Firebase Admin) ===');
        const healthCheck = await testEndpoint(
            'Health Check',
            `${NUXT_PUBLIC_API_BASE_URL}/api/admin/health-check`,
            { method: 'GET' }
        );

        console.log('\nAnalysis:');
        if (healthCheck.ok) {
            console.log('✓ Health check endpoint is accessible');
            console.log('Firebase Admin Status:', healthCheck.data?.firebaseAdminInitialized || 'unknown');
        } else {
            console.log('✗ Health check failed');
        }

        // Test 4: Public profile with non-existent UID
        console.log('\n\n=== Test 4: Public Profile (Invalid UID) ===');
        const invalidProfile = await testEndpoint(
            'Get Invalid Profile',
            `${NUXT_PUBLIC_API_BASE_URL}/api/profile/invalid-uid-12345`,
            { method: 'GET' }
        );

        console.log('\nAnalysis:');
        if (invalidProfile.status === 404) {
            console.log('✓ Correctly returns 404 for invalid UID');
        } else {
            console.log(`✗ Expected 404, got ${invalidProfile.status}`);
        }

// Test 5: Check articles count directly from Firebase
        console.log('\n\n=== Test 5: Firebase Direct Query ===');
        const db = admin.firestore();
        const articlesSnapshot = await db.collection('articles')
            .where('authorUid', '==', uid)
            .get();

        console.log(`Articles found in Firebase: ${articlesSnapshot.docs.length}`);

        if (articlesSnapshot.docs.length > 0) {
            const article = articlesSnapshot.docs[0];
            console.log('Sample article:', {
                id: article.id,
                title: article.data()?.title,
                author: article.data()?.author,
                authorUid: article.data()?.authorUid,
                hasIntro: !!article.data()?.intro,
                hasImage: !!article.data()?.image,
                hasBody: !!article.data()?.body,
                published: article.data()?.published
            });
        }

        console.log('\n\n=== Body Gating Verification ===');
        console.log('Checking that public profile API does NOT include body...');
        if (publicProfile.data?.articles?.[0]) {
            const hasBody = !!publicProfile.data.articles[0].body;
            console.log(`   Article has body field: ${hasBody ? 'YES (error!)' : 'NO (correct)'}`);
            if (hasBody) {
                issues.push('Public profile API includes body - should not be!');
            }
        } else {
            console.log('   No articles found to check');
            issues.push('Public profile has no articles (data issue)');
        }

        console.log('\n\n=== SUMMARY ===');

        const issues: string[] = [];

        if (!publicProfile.data?.articles || publicProfile.data.articles.length === 0) {
            issues.push('Public profile returns no articles');
        } else if (publicProfile.data.articles.length !== articlesSnapshot.docs.length) {
            issues.push(`Public profile count (${publicProfile.data.articles.length}) doesn't match Firebase (${articlesSnapshot.docs.length})`);
        }

        if (!healthCheck.ok) {
            issues.push('Health check failed - Firebase Admin may not be initialized');
        }
        
        if (!healthCheck.ok) {
            issues.push('Health check failed - Firebase Admin may not be initialized');
        }
        
        if (issues.length > 0) {
            console.log('🔴 ISSUES FOUND:');
            issues.forEach(issue => console.log(`  - ${issue}`));
        } else {
            console.log('✅ ALL TESTS PASSED');
        }
        
    } catch (error: any) {
        console.error('\n✗ Test suite failed:', error.message);
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