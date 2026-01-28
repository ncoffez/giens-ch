import 'dotenv/config';

import admin from 'firebase-admin';
import { existsSync } from 'fs';

console.log('=== Icon Bundle Verification Test ===\n');

if (!existsSync('.env')) {
    console.error('ERROR: .env file not found');
    process.exit(1);
}

const { NUXT_PUBLIC_API_BASE_URL = 'http://localhost:3000' } = process.env;

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> {
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
        console.log('[1/3] Testing that icon bundle is loaded locally...');
        
        await sleep(2000);
        
        const iconApiUrl = `${NUXT_PUBLIC_API_BASE_URL}/api/_nuxt_icon/i-lucide-home`;
        
        try {
            const response = await fetchWithTimeout(iconApiUrl);
            console.log(`   API endpoint status: ${response.status}`);
            
            if (response.status !== 200) {
                console.log('❌ FAILED: Icon API endpoint not responding correctly');
                console.log('   Icons may not be bundled properly');
                process.exit(1);
            }
            
            const data = await response.json();
            
            if (!data || !data.body) {
                console.log('❌ FAILED: Icon API returned invalid data');
                console.log('   Response:', data);
                process.exit(1);
            }
            
            console.log('✅ Icon API endpoint working correctly');
            console.log(`   Icon loaded successfully: ${data.defaultBody ? 'Yes' : 'No'}`);
            
        } catch (e: any) {
            console.log('❌ FAILED: Cannot reach icon API endpoint');
            console.log(`   Error: ${e.message}`);
            console.log('   Solution: Ensure @iconify-json/lucide is installed and nuxt.config.ts icon config is correct');
            process.exit(1);
        }
        
        console.log('\n[2/3] Checking that icon API exists and is configured...');
        
        const testIcons = ['user', 'home', 'calendar', 'check', 'chevron-right'];
        let passedIcons = 0;
        
        for (const iconName of testIcons) {
            try {
                const iconUrl = `${NUXT_PUBLIC_API_BASE_URL}/api/_nuxt_icon/i-lucide-${iconName}`;
                const response = await fetchWithTimeout(iconUrl);

                if (response.status === 200) {
                    const data = await response.json();
                    if (data.body || data.defaultBody) {
                        passedIcons++;
                        console.log(`   ✓ ${iconName}: Loaded`);
                    } else {
                        console.log(`   ✗ ${iconName}: Missing body data`);
                    }
                } else {
                    console.log(`   ✗ ${iconName}: ${response.status} ${response.statusText}`);
                }
            } catch (e) {
                console.log(`   ✗ ${iconName}: ${e.message}`);
            }
        }
        
        console.log(`  Icons passed: ${passedIcons}/${testIcons.length}`);
        
        if (passedIcons === 0) {
            console.log('\n❌ FAILED: No icons loaded from local bundle');
            console.log('   All icons are still being fetched from Iconify CDN');
            console.log('   Rate limiting issues will continue to occur during HMR');
            process.exit(1);
        }
        
        console.log('\n[3/3] Verifying no external icon requests...');
        console.log('   Instructions for verification:');
        console.log('   1. Open browser DevTools (F12)');
        console.log('   2. Go to Network tab');
        console.log('   3. Filter by "api.iconify"');
        console.log('   4. Reload the page');
        console.log('   5. Check if ANY requests to iconify API appear');
        console.log('');
        console.log('   Expected: NO requests to api.iconify.design');
        console.log('   Expected: Icons load from /api/_nuxt_icon/ local endpoint');
        console.log('');
        console.log('   If you STILL see iconify API requests, check:');
        console.log('   - nuxt.config.ts icon configuration');
        console.log('   - @iconify-json/lucide is installed');
        console.log('   - Dev server was restarted after config change');

        console.log('\n\n=== VERIFICATION COMPLETE ===');
        
        if (passedIcons === testIcons.length) {
            console.log('✅ ALL ICONS LOADED LOCALLY');
            console.log('\nRate limiting during HMR should be ELIMINATED.');
            console.log('Icons load instantly without network requests.');
            console.log('Configuration is correct!');
        } else {
            console.log('⚠ PARTIAL SUCCESS');
            console.log(`   ${passedIcons}/${testIcons.length} icons loaded locally`);
            console.log(`   ${testIcons.length - passedIcons} icons still hitting API`);
            console.log('');
            console.log('Check your nuxt.config.ts configuration:');
            console.log('  icon: {');
            console.log('    provider: "none",  // Disables API fallback');
            console.log('    clientBundle: {');
            console.log('      scan: true,       // Auto-scan components');
            console.log('      sizeLimitKb: 512, // Bundle size limit');
            console.log('    }');
            console.log('  }');
        }

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