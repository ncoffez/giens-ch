#!/usr/bin/env node

import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { config as dotenvConfig } from "dotenv";

console.log("Setting up Firebase Admin SDK...");

try {
	// Load environment variables from .env
	if (!existsSync(".env")) {
		console.error("ERROR: .env file not found in current directory");
		process.exit(1);
	}

	const env = dotenvConfig({ path: ".env" }).parsed;

	if (!env.FIREBASE_ADMIN_KEY) {
		console.error("ERROR: FIREBASE_ADMIN_KEY environment variable not found in .env");
		console.log("");
		console.log("Please ensure your .env file contains:");
		console.log("  FIREBASE_ADMIN_KEY='{...service_account_key_json...}'");
		console.log("");
		console.log("The migration cannot proceed without Firebase Admin credentials.");
		process.exit(1);
	}

	let serviceAccount;
	try {
		serviceAccount = JSON.parse(env.FIREBASE_ADMIN_KEY);
	} catch (e) {
		console.error("ERROR: Failed to parse FIREBASE_ADMIN_KEY as JSON");
		console.error("Please ensure FIREBASE_ADMIN_KEY contains valid JSON");
		process.exit(1);
	}

	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
	});

	const db = admin.firestore();

	// Track statistics
	const stats = {
		migratedContent: 0,
		errors: []
	};

	console.log("Firebase Admin initialized successfully");
	console.log("");
	console.log("Starting migration to flat i18n content structure (translated.fr)...");

	try {
		// Migrate content collection
		console.log("Migrating content collection...");
		const contentSnapshot = await db.collection("content").get();
		
		for (const doc of contentSnapshot.docs) {
			const data = doc.data();
			const content = data.content;
			
			// Check if content is in old format { de: "...", fr: "..." }
			if (content && typeof content === "object" && content.de !== undefined) {
				const germanContent = content.de || "";
				const frenchContent = content.fr || "";
				
				await db.collection("content").doc(doc.id).update({
					content: germanContent,
					translated: { fr: frenchContent },
				});
				
				stats.migratedContent++;
				console.log(`  ✓ Migrated content/${doc.id}`);
			}
		}
		
		console.log(`  Migrated ${stats.migratedContent} content documents`);

		// Note: The Firebase Translate Extension will automatically create translations
		// for new content or when content is updated

		// Verification report
		console.log("");
		console.log("--- Migration Report ---");
		console.log(`Status: Success`);
		console.log(`Migrated Content Documents: ${stats.migratedContent}`);

		if (stats.errors.length > 0) {
			console.log("");
			console.log(`Errors (${stats.errors.length}):`);
			stats.errors.forEach((err) => console.log(`  - ${err}`));
		}

		console.log("");
		console.log("✓ Migration completed successfully");
		console.log("");
		console.log("Next steps:");
		console.log("  1. Install the Firebase Translate Extension:");
		console.log("     firebase ext:install firebase/firestore-translate-text --project=<your-project-id>");
		console.log("  2. Configure the extension with:");
		console.log("     - COLLECTION_PATH: content");
		console.log("     - INPUT_FIELD_NAME: content");
		console.log("     - OUTPUT_FIELD_NAME: translated.fr");
		console.log("     - LANGUAGES: fr");
		console.log("     - SOURCE_LANGUAGE: de");
		console.log("  3. Deploy your changes: npm run deploy");

	} catch (error) {
		console.error("");
		console.error("✗ Migration failed");
		console.error("");
		console.error("Error Details:");
		console.error(error.message || error.stack || JSON.stringify(error));

		process.exit(1);
	}
} catch (error) {
	console.error("");
	console.error("FATAL ERROR: Failed to initialize Firebase Admin SDK");
	console.error("");
	console.error("Error Details:");
	console.error(error.message || error.stack || JSON.stringify(error));

	process.exit(1);
}
