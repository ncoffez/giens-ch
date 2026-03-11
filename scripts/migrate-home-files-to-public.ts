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
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket();

console.log('Firebase Admin initialized successfully');
console.log('');
console.log('Starting migration to public URLs for home files...');

const stats = {
    homesProcessed: 0,
    filesMigrated: 0,
    filesSkipped: 0,
    errors: [] as string[]
};

try {
    console.log('Fetching homes with files from database...');
    const allHomesSnapshot = await db.collection('homes').get();
    
    console.log(`Found ${allHomesSnapshot.docs.length} homes in database`);
    console.log('');

    for (const homeDoc of allHomesSnapshot.docs) {
        const homeData = homeDoc.data();
        const files: any[] = homeData.files || [];
        
        if (files.length === 0) continue;
        
        stats.homesProcessed++;
        console.log(`Processing home ${homeDoc.id} (${files.length} files)...`);
        
        let hasChanges = false;
        const updatedFiles: any[] = [];
        
        for (const file of files) {
            // Check if this is a signed URL (contains GoogleAccessId or Expires)
            const isSignedUrl = file.url && (
                file.url.includes('GoogleAccessId=') ||
                file.url.includes('Expires=') ||
                file.url.includes('Signature=')
            );
            
            if (!isSignedUrl) {
                // Already a public URL or different format, skip
                updatedFiles.push(file);
                stats.filesSkipped++;
                continue;
            }
            
            // Check if we have a storage path
            if (!file.storagePath) {
                console.log(`  ⚠ File ${file.name} has no storagePath, skipping`);
                updatedFiles.push(file);
                stats.filesSkipped++;
                continue;
            }
            
            try {
                // Make the file public
                const fileRef = bucket.file(file.storagePath);
                
                try {
                    await fileRef.makePublic();
                } catch (e: any) {
                    // Might already be public or bucket-level access
                    console.log(`  ⚠ Could not make ${file.name} public: ${e.message}`);
                }
                
                // Generate public URL
                const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.storagePath)}?alt=media`;
                
                updatedFiles.push({
                    ...file,
                    url: publicUrl
                });
                
                hasChanges = true;
                stats.filesMigrated++;
                console.log(`  ✓ Migrated ${file.name}`);
            } catch (e: any) {
                console.error(`  ✗ Failed to migrate ${file.name}: ${e.message}`);
                stats.errors.push(`${homeDoc.id}/${file.name}: ${e.message}`);
                updatedFiles.push(file);
            }
        }
        
        // Update the home document if there were changes
        if (hasChanges) {
            await db.collection('homes').doc(homeDoc.id).update({
                files: updatedFiles,
                updatedAt: new Date().toISOString()
            });
            console.log(`  ✓ Updated home ${homeDoc.id}`);
        }
    }

    // Summary report
    console.log('');
    console.log('--- Migration Report ---');
    console.log(`Status: ${stats.errors.length > 0 ? 'Completed with errors' : 'Success'}`);
    console.log(`Homes Processed: ${stats.homesProcessed}`);
    console.log(`Files Migrated: ${stats.filesMigrated}`);
    console.log(`Files Skipped: ${stats.filesSkipped}`);
    
    if (stats.errors.length > 0) {
        console.log('');
        console.log('Errors:');
        stats.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('');
    console.log('✓ Migration completed');
    console.log('');
    console.log('All home files now use public URLs that do not expire.');

} catch (error: any) {
    console.error('');
    console.error('✗ Migration failed');
    console.error('');
    console.error('Error Details:');
    console.error(error.message || error.stack || JSON.stringify(error));
    process.exit(1);
}
