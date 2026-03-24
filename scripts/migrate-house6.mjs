#!/usr/bin/env node

import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { join, basename } from "path";
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
		storageBucket: serviceAccount.project_id + ".appspot.com",
	});

	const db = admin.firestore();
	const storage = admin.storage().bucket();

	console.log("Firebase Admin initialized successfully");
	console.log("");
	console.log("Starting House 6 migration...");

	// House 6 content from documents
	const house6Content = {
		name: "Haus 6",
		houseNumber: 6,
		enabled: true,
		wifiPassword: "SFR_CFAF: 6qt36u5iudtzq9ittmr8",
		parkingNumber: "6",
		contact: {
			name: "Hans-Peter und Brigitte Riesen",
			email: "hans-peter.riesen@bluewin.ch",
			phone: "+41 79 465 60 10"
		},
		checkInInfo: `<h3>Wasser und Strom</h3>
<ul>
<li><strong>Hauptwasserhahn öffnen</strong> – Unter dem Spülbecken der Küche, unterhalb des Wasserzählers</li>
<li><strong>Sicherungen einschalten</strong> – Die 3 Öfen, Kochherd und Kochplatten auf "ON" stellen</li>
</ul>
<h3>Solareinstellung Warmwasser</h3>
<p>Siehe beiliegende Anleitung (Solaruhr) für die korrekte Einstellung der Warmwasseraufbereitung.</p>
<h3>Kaffeemaschine</h3>
<p>Dolce Gusto – Kaffeekapseln sind in der Schweiz und Frankreich problemlos erhältlich. Anweisung liegt bereit.</p>
<h3>WLAN</h3>
<ul>
<li><strong>Netzwerk:</strong> SFR_CFAF</li>
<li><strong>Passwort:</strong> 6qt36u5iudtzq9ittmr8</li>
</ul>
<h3>Torcode</h3>
<p>Das Eingangstor zur Siedlung lässt sich mit dem Code <strong>5378A</strong> öffnen.</p>`,
		checkOutInfo: `<h3>Wasser und Strom</h3>
<ul>
<li><strong>Hauptwasserhahn schliessen</strong> – Unter dem Spülbecken der Küche, unterhalb des Wasserzählers</li>
<li><strong>Sicherungen ausschalten</strong> – Die 3 Öfen, Kochherd und Kochplatten auf "OFF" stellen</li>
</ul>
<h3>Küche</h3>
<ul>
<li>Geschirr und Küchengeräte sauber und eingeräumt hinterlassen</li>
<li>Die Küche sauber hinterlassen</li>
<li>Kühlschrank entleeren, reinigen, ausschalten und enteisen</li>
<li>Kühlschranktüren mit der Kühlschranksperre (weisser Gummi in Hufeisenform) sichern</li>
<li>Abwaschmaschine: Filter reinigen</li>
</ul>
<h3>Schlafzimmer & Bettwäsche</h3>
<ul>
<li>Bettwäsche bei Abreise abziehen und im blauen Korb im Wohnraum abstellen</li>
</ul>
<h3>Fenster und Türen</h3>
<ul>
<li>Läden hinten schliessen und verriegeln</li>
<li>Fenster im Zimmer unten kippen</li>
<li>Seitenfenster oben mit Schnur befestigen</li>
<li>Velux (Dachfenster) schliessen und Verschluss leicht kippen</li>
<li>Zimmer-, WC- und Badezimmertüren offenlassen (bessere Lüftung)</li>
</ul>
<h3>Abfall</h3>
<p>Abfall trennen (siehe beiliegende Anleitung)</p>
<h3>Garten und Terrasse</h3>
<ul>
<li>Gartentisch und Stühle auf Terrasse zudecken und mit Steinen befestigen</li>
</ul>
<h3>Schlüsselabgabe</h3>
<ul>
<li>Schlüssel auf dem Tisch des Aufenthaltsraumes deponieren</li>
<li>Geschlossene Türläden mit einem Gartenstuhl sichern</li>
</ul>`,
		mustKnows: [
			"Endreinigung 40€ an Mme Delcroix (blaue Schachtel auf dem Tisch)",
			"Torcode: 5378A",
			"Am Abend viele Mücken – Türen schliessen!",
			"Haustiere sind nicht gestattet"
		],
		houseRules: `<h3>Haustiere</h3>
<p>Das Halten von Haustieren jeglicher Art ist in der Siedlung grundsätzlich nicht gestattet. Hunde dürfen unter keinen Umständen frei in der Résidence laufen gelassen werden.</p>
<h3>Rücksichtnahme</h3>
<p>Bitte nehmen Sie Rücksicht auf die Mitbewohner der Feriensiedlung. Befolgen Sie die Anweisungen betreffend dem Verhalten und alle anderen Anordnungen.</p>`,
		blanketsInfo: `<p><strong>Bettwäsche im hinteren Zimmer im 2. Schrank:</strong></p>
<ul>
<li><strong>Blaue Bettwäsche:</strong> Oben</li>
<li><strong>Orange Bettwäsche:</strong> Unten</li>
</ul>
<p>Die Anzüge passen zu allen Decken und Kissen. Matratzenschoner nicht vergessen!</p>`,
		cleaningInfo: [
			"WC, Duschkabine und Lavabos sauber hinterlassen",
			"Geschirr und Küchengeräte sauber und eingeräumt",
			"Die Küche sauber hinterlassen",
			"Kühlschrank entleeren, reinigen, ausschalten, enteisen",
			"Abwaschmaschine: Filter reinigen"
		],
		washingMachineOverride: `<p><strong>Keine Waschmaschine im Haus vorhanden.</strong></p>
<p>Ein Waschsalon (Laverie) befindet sich in Richtung Hyères:</p>
<ul>
<li>An der ersten Ampel links (Av. de l'Aéroport / Chemin du Palyvestre), vor dem Restaurant Plan B</li>
<li>Alternativ zwischen dem ersten und zweiten Kreisverkehr auf der rechten Strassenseite</li>
</ul>`
	};

	// Files to upload
	const filesToUpload = [
		{ path: "Haus6-anleitungen/Abfall Entsorgung dt.pdf", name: "Abfall Entsorgung (Deutsch).pdf" },
		{ path: "Haus6-anleitungen/Abfall Entsorgung fr.pdf", name: "Abfall Entsorgung (Französisch).pdf" },
		{ path: "Haus6-anleitungen/Beschreibung Solaruhr Seite 1 fr - dt.pdf", name: "Solaruhr Anleitung.pdf" },
		{ path: "Haus6-anleitungen/Hauptwasserhahnen dt.docx", name: "Hauptwasserhahn (Deutsch).docx" },
		{ path: "Haus6-anleitungen/Hauptwasserhahnen fr.doc", name: "Hauptwasserhahn (Französisch).doc" },
	];

	// Generate UUID
	function generateUUID() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
			const r = Math.random() * 16 | 0;
			const v = c === "x" ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	// Main migration
	const stats = {
		homeCreated: false,
		homeUpdated: false,
		filesUploaded: 0,
		errors: []
	};

	try {
		// Step 1: Find or create House 6
		console.log("Looking for existing House 6...");
		const existingHomes = await db.collection("homes").where("houseNumber", "==", 6).limit(1).get();
		
		let homeId;
		
		if (!existingHomes.empty) {
			homeId = existingHomes.docs[0].id;
			console.log(`  Found existing House 6 with ID: ${homeId}`);
		} else {
			console.log("  House 6 not found, creating new...");
			homeId = generateUUID();
			const now = new Date().toISOString();
			
			await db.collection("homes").doc(homeId).set({
				id: homeId,
				...house6Content,
				slug: generateUUID(),
				ownerIds: [],
				editors: [],
				photos: [],
				files: [],
				folders: [],
				createdAt: now,
				updatedAt: now,
			});
			stats.homeCreated = true;
			console.log(`  Created House 6 with ID: ${homeId}`);
		}

		// Step 2: Update house content
		console.log("Updating House 6 content...");
		await db.collection("homes").doc(homeId).update({
			...house6Content,
			updatedAt: new Date().toISOString(),
		});
		stats.homeUpdated = true;
		console.log("  Content updated successfully");

		// Step 3: Upload files
		console.log("");
		console.log("Uploading files...");
		const homeDoc = await db.collection("homes").doc(homeId).get();
		const existingFiles = homeDoc.data()?.files || [];

		for (const fileInfo of filesToUpload) {
			const filePath = join(process.cwd(), fileInfo.path);
			
			if (!existsSync(filePath)) {
				console.log(`  Skipping ${fileInfo.name} - file not found at ${filePath}`);
				continue;
			}

			// Check if file already exists
			const alreadyExists = existingFiles.some((f) => f.name === fileInfo.name);
			if (alreadyExists) {
				console.log(`  Skipping ${fileInfo.name} - already uploaded`);
				continue;
			}

			try {
				const fileBuffer = readFileSync(filePath);
				const fileId = generateUUID();
				const timestamp = Date.now();
				const sanitized = fileInfo.name.replace(/[^a-zA-Z0-9.-]/g, "_");
				const storagePath = `homes/${homeId}/files/${timestamp}-${sanitized}`;

				// Determine content type
				const ext = fileInfo.name.split(".").pop()?.toLowerCase();
				const contentTypes = {
					"pdf": "application/pdf",
					"doc": "application/msword",
					"docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				};
				const contentType = contentTypes[ext] || "application/octet-stream";

				// Upload to Firebase Storage
				const file = storage.file(storagePath);
				await file.save(fileBuffer, {
					metadata: {
						contentType,
						metadata: {
							homeId,
							originalName: fileInfo.name,
						},
					},
				});

				// Add file record to Firestore
				const fileRecord = {
					id: fileId,
					name: fileInfo.name,
					type: contentType,
					size: fileBuffer.length,
					storagePath,
					folderId: null,
					uploadedAt: new Date().toISOString(),
					uploadedBy: "migration-script",
				};

				existingFiles.push(fileRecord);
				stats.filesUploaded++;
				console.log(`  ✓ Uploaded: ${fileInfo.name}`);

			} catch (e) {
				stats.errors.push(`Failed to upload ${fileInfo.name}: ${e.message}`);
				console.error(`  ✗ Failed to upload ${fileInfo.name}: ${e.message}`);
			}
		}

		// Update files in Firestore
		if (stats.filesUploaded > 0) {
			await db.collection("homes").doc(homeId).update({
				files: existingFiles,
				updatedAt: new Date().toISOString(),
			});
			console.log(`  Updated ${existingFiles.length} files in database`);
		}

		// Report
		console.log("");
		console.log("--- Migration Report ---");
		console.log(`Home Created: ${stats.homeCreated}`);
		console.log(`Home Updated: ${stats.homeUpdated}`);
		console.log(`Files Uploaded: ${stats.filesUploaded}`);

		if (stats.errors.length > 0) {
			console.log("");
			console.log(`Errors (${stats.errors.length}):`);
			stats.errors.forEach((err) => console.log(`  - ${err}`));
		}

		console.log("");
		console.log("✓ Migration completed successfully");
		console.log("");
		console.log("You can now:");
		console.log("  - View House 6 at /homes/[homeId]");
		console.log("  - Assign owners via /admin/homes");
		console.log("  - Edit content at /homes/[homeId]/edit");

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
