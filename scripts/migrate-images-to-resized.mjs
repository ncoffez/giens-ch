#!/usr/bin/env node

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const limitArg = args.find((arg) => arg.startsWith("--limit"));
const limit = limitArg ? parseInt(limitArg.split("=")[1] || args[args.indexOf(limitArg) + 1]) : null;

console.log("=== IMAGE MIGRATION ===\n");
console.log(`Mode: ${isDryRun ? "DRY RUN (no changes)" : "REAL MIGRATION"}`);
if (limit) console.log(`Limit: ${limit} files`);
console.log("");

let app, db, bucket;

function initFirebase() {
	const envPath = resolve(__dirname, "../.env");

	let serviceAccount = null;
	let bucketName = null;

	if (existsSync(envPath)) {
		console.log("Loading credentials from .env file...\n");
		const envContent = readFileSync(envPath, "utf8");

		const adminKeyMatch = envContent.match(/FIREBASE_ADMIN_KEY='(.+?)'/s);
		if (adminKeyMatch) {
			try {
				serviceAccount = JSON.parse(adminKeyMatch[1]);
				console.log(`  Project: ${serviceAccount.project_id}`);
			} catch (e) {
				console.error("Failed to parse FIREBASE_ADMIN_KEY from .env");
				console.error(e.message);
				process.exit(1);
			}
		}

		const bucketMatch = envContent.match(/STORAGE_BUCKET='?([^'\n]+)'?/);
		if (bucketMatch) {
			bucketName = bucketMatch[1].trim();
		}
	}

	if (!serviceAccount) {
		console.error("No Firebase credentials found. Please ensure .env contains FIREBASE_ADMIN_KEY");
		process.exit(1);
	}

	if (!bucketName) {
		bucketName = `${serviceAccount.project_id}.appspot.com`;
	}

	console.log(`  Storage bucket: ${bucketName}\n`);

	app = initializeApp({
		credential: cert(serviceAccount),
		storageBucket: bucketName,
	});

	db = getFirestore(app);
	bucket = getStorage(app).bucket();
}

async function loadFolderHierarchy() {
	console.log("Loading folder hierarchy...");
	const foldersSnapshot = await db.collection("globalFolders").get();
	const folderMap = {};

	foldersSnapshot.forEach((doc) => {
		const data = doc.data();
		folderMap[doc.id] = {
			id: doc.id,
			name: data.name,
			parentId: data.parentId || null,
		};
	});

	console.log(`  Found ${Object.keys(folderMap).length} folders\n`);
	return folderMap;
}

function extractYearFromFolderName(name) {
	if (!name) return null;
	const yearMatch = name.match(/^(19[89]\d|20[01]\d|202[0-5])$/);
	if (yearMatch) return parseInt(yearMatch[1]);
	return null;
}

function findFolderYear(file, folderMap) {
	if (!file.folderId) return null;

	const visited = new Set();
	let currentFolderId = file.folderId;

	while (currentFolderId && !visited.has(currentFolderId)) {
		visited.add(currentFolderId);
		const folder = folderMap[currentFolderId];
		if (!folder) break;

		const year = extractYearFromFolderName(folder.name);
		if (year) return year;

		currentFolderId = folder.parentId;
	}

	return null;
}

function extractDateFromFilename(filename) {
	if (!filename) return null;

	const name = filename.toLowerCase();

	const fullDatePatterns = [
		/(?:^|[_-])(\d{4})[-_](\d{2})[-_](\d{2})/,
		/(?:^|[_-])(\d{2})(\d{2})(\d{2})\./,
		/(?:^|[_-])(\d{6})\./,
	];

	for (const pattern of fullDatePatterns) {
		const match = name.match(pattern);
		if (match) {
			if (match.length === 4) {
				let year = parseInt(match[1]);
				let month = parseInt(match[2]);
				let day = parseInt(match[3]);

				if (year < 100) {
					year = year >= 80 ? 1900 + year : 2000 + year;
				}

				if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
					return new Date(Date.UTC(year, month - 1, day));
				}
			} else if (match.length === 2 && match[1].length === 6) {
				const dateStr = match[1];
				let yy = parseInt(dateStr.substring(0, 2));
				const mm = parseInt(dateStr.substring(2, 4));
				const dd = parseInt(dateStr.substring(4, 6));

				yy = yy >= 80 ? 1900 + yy : 2000 + yy;

				if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
					return new Date(Date.UTC(yy, mm - 1, dd));
				}
			}
		}
	}

	const yearPatterns = [
		/(?:^|[_-])(19[89]\d|20[01]\d|202[0-5])(?:[_\-\.]|$)/,
	];

	for (const pattern of yearPatterns) {
		const match = name.match(pattern);
		if (match) {
			let year = parseInt(match[1]);
			return new Date(Date.UTC(year, 0, 1));
		}
	}

	return null;
}

async function loadFiles() {
	console.log("Loading file documents...");
	const filesSnapshot = await db.collection("globalFiles").get();
	const files = [];

	filesSnapshot.forEach((doc) => {
		const data = doc.data();
		if (data.type?.startsWith("image/") && data.storagePath) {
			files.push({
				id: doc.id,
				name: data.name,
				type: data.type,
				size: data.size,
				storagePath: data.storagePath,
				folderId: data.folderId || null,
				lastModified: data.lastModified || null,
				uploadedAt: data.uploadedAt,
			});
		}
	});

	console.log(`  Found ${filesSnapshot.size} total files`);
	console.log(`  Filtered to ${files.length} image files\n`);
	return files;
}

async function getStorageFileMetadata(storagePath) {
	try {
		const file = bucket.file(storagePath);
		const [metadata] = await file.getMetadata();
		return metadata;
	} catch {
		return null;
	}
}

async function triggerExtension(storagePath) {
	const file = bucket.file(storagePath);

	const [exists] = await file.exists();
	if (!exists) {
		throw new Error(`File not found: ${storagePath}`);
	}

	const pathParts = storagePath.split("/");
	const dirPath = pathParts.slice(0, -1).join("/");
	const fileName = pathParts.pop();
	const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf("."));

	const thumbnailPath = `${dirPath}/resized/${nameWithoutExt}_400x400.webp`;
	const thumbnailFile = bucket.file(thumbnailPath);
	const [thumbExists] = await thumbnailFile.exists();

	if (thumbExists) {
		return { skipped: true };
	}

	const [content] = await file.download();
	const [metadata] = await file.getMetadata();

	await file.delete();

	const newFile = bucket.file(storagePath);
	await newFile.save(content, {
		metadata: {
			contentType: metadata.contentType,
			metadata: {
				...metadata.metadata,
				migratedAt: Date.now().toString(),
			},
		},
	});

	return { skipped: false };
}

function formatDate(date) {
	if (!date) return null;
	return date.toISOString().split("T")[0];
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runMigration() {
	initFirebase();

	const folderMap = await loadFolderHierarchy();
	const files = await loadFiles();

	const filesToProcess = limit ? files.slice(0, limit) : files;

	console.log(`Processing ${filesToProcess.length} image files...\n`);

	const results = {
		total: filesToProcess.length,
		processed: 0,
		skipped: 0,
		errors: 0,
		datesFound: 0,
		dateSamples: [],
	};

	for (let i = 0; i < filesToProcess.length; i++) {
		const file = filesToProcess[i];
		const progress = `[${i + 1}/${filesToProcess.length}]`;

		try {
			const folderYear = findFolderYear(file, folderMap);
			const filenameDate = extractDateFromFilename(file.name);

			let finalDate = null;

			if (filenameDate) {
				finalDate = filenameDate;
			} else if (folderYear) {
				finalDate = new Date(Date.UTC(folderYear, 0, 1));
			} else {
				const metadata = await getStorageFileMetadata(file.storagePath);
				if (metadata?.timeCreated) {
					finalDate = new Date(metadata.timeCreated);
				}
			}

			if (results.dateSamples.length < 15) {
				results.dateSamples.push({
					name: file.name,
					folderYear,
					filenameDate: formatDate(filenameDate),
					finalDate: formatDate(finalDate),
				});
			}

			if (finalDate) {
				results.datesFound++;
			}

			if (isDryRun) {
				results.processed++;
				if ((i + 1) % 50 === 0 || i === filesToProcess.length - 1) {
					console.log(`  ${progress} Scanned (dry run)`);
				}
			} else {
				const triggerResult = await triggerExtension(file.storagePath);

				if (triggerResult.skipped) {
					results.skipped++;
					if ((i + 1) % 50 === 0) {
						console.log(`  ${progress} Skipped (already has resized versions)`);
					}
				} else {
					if (finalDate) {
						await db.collection("globalFiles").doc(file.id).update({
							lastModified: finalDate.getTime(),
						});
					}

					results.processed++;
					console.log(`  ${progress} ✓ ${file.name} → ${formatDate(finalDate) || "no date"}`);

					await sleep(100);
				}
			}
		} catch (error) {
			results.errors++;
			console.error(`  ${progress} ✗ Error processing ${file.name}: ${error.message}`);
		}
	}

	console.log("\n=== SUMMARY ===");
	console.log(`Mode: ${isDryRun ? "DRY RUN" : "MIGRATION COMPLETE"}`);
	console.log(`Total images: ${results.total}`);
	console.log(`Processed: ${results.processed}`);
	console.log(`Skipped (already resized): ${results.skipped}`);
	console.log(`Errors: ${results.errors}`);
	console.log(`Dates extracted: ${results.datesFound}/${results.total}`);

	if (isDryRun) {
		console.log("\n=== DATE EXTRACTION SAMPLES ===");
		for (const sample of results.dateSamples) {
			console.log(`  ${sample.name}`);
			console.log(`    Folder year: ${sample.folderYear || "none"}`);
			console.log(`    Filename date: ${sample.filenameDate || "none"}`);
			console.log(`    Final date: ${sample.finalDate || "fallback to upload date"}`);
			console.log("");
		}

		console.log("\nRun without --dry-run to perform actual migration.");
	}
}

runMigration().catch((error) => {
	console.error("Migration failed:", error);
	process.exit(1);
});
