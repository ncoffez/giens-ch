import "dotenv/config";
import admin from "firebase-admin";
import crypto from "crypto";
import { existsSync } from "fs";
import { buildFirebaseDownloadUrl } from "../server/utils/storage.ts";

const EDITOR_UPLOAD_URL_REGEX = /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/([^/]+)\/o\/([^"?]+)\?alt=media(?:&token=[^"'\\s<]*)?/g;

if (!existsSync(".env")) {
	console.error("ERROR: .env file not found");
	process.exit(1);
}

if (!process.env.FIREBASE_ADMIN_KEY) {
	console.error("ERROR: FIREBASE_ADMIN_KEY not found in .env");
	process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);

if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		storageBucket: process.env.STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`,
	});
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const decodeStoragePath = (encodedPath: string) => {
	return decodeURIComponent(encodedPath).replace(/\+/g, " ");
};

const ensureTokenizedUrl = async (storagePath: string) => {
	const file = bucket.file(storagePath);
	const [metadata] = await file.getMetadata();
	const existingTokens = metadata.metadata?.firebaseStorageDownloadTokens;
	const token = existingTokens?.split(",")[0] || crypto.randomUUID();

	if (!existingTokens) {
		await file.setMetadata({
			metadata: {
				...(metadata.metadata || {}),
				firebaseStorageDownloadTokens: token,
			},
		});
	}

	return buildFirebaseDownloadUrl(bucket.name, storagePath, token);
};

const replaceEditorUrls = async (value: string) => {
	let updated = value;
	let changed = false;

	const matches = Array.from(value.matchAll(EDITOR_UPLOAD_URL_REGEX));
	for (const match of matches) {
		const rawUrl = match[0];
		const encodedPath = match[2];
		if (!encodedPath) continue;

		const storagePath = decodeStoragePath(encodedPath);
		if (!storagePath.startsWith("editor-uploads/")) continue;

		const tokenizedUrl = await ensureTokenizedUrl(storagePath);
		if (tokenizedUrl !== rawUrl) {
			updated = updated.replaceAll(rawUrl, tokenizedUrl);
			changed = true;
		}
	}

	return { updated, changed };
};

async function migrateContentCollection() {
	const snapshot = await db.collection("content").get();
	let updatedCount = 0;

	for (const doc of snapshot.docs) {
		const data = doc.data() as {
			content?: string | { de?: string; fr?: string };
			translated?: { fr?: string };
		};
		const updates: Record<string, unknown> = {};

		if (typeof data.content === "string") {
			const result = await replaceEditorUrls(data.content);
			if (result.changed) {
				updates.content = result.updated;
			}
		} else if (data.content && typeof data.content === "object") {
			const localized = { ...data.content };
			let localizedChanged = false;

			for (const key of ["de", "fr"] as const) {
				if (!localized[key]) continue;
				const result = await replaceEditorUrls(localized[key] || "");
				if (result.changed) {
					localized[key] = result.updated;
					localizedChanged = true;
				}
			}

			if (localizedChanged) {
				updates.content = localized;
			}
		}

		if (data.translated?.fr) {
			const result = await replaceEditorUrls(data.translated.fr);
			if (result.changed) {
				updates.translated = {
					...(data.translated || {}),
					fr: result.updated,
				};
			}
		}

		if (Object.keys(updates).length > 0) {
			updates.updatedAt = new Date().toISOString();
			await doc.ref.set(updates, { merge: true });
			updatedCount++;
		}
	}

	return updatedCount;
}

async function migrateArticles() {
	const snapshot = await db.collection("articles").get();
	let updatedCount = 0;

	for (const doc of snapshot.docs) {
		const data = doc.data() as { body?: string };
		if (!data.body) continue;

		const result = await replaceEditorUrls(data.body);
		if (!result.changed) continue;

		await doc.ref.update({
			body: result.updated,
			updatedAt: new Date().toISOString(),
		});
		updatedCount++;
	}

	return updatedCount;
}

async function migrateHomes() {
	const snapshot = await db.collection("homes").get();
	let updatedCount = 0;

	for (const doc of snapshot.docs) {
		const data = doc.data() as { instructions?: string };
		if (!data.instructions) continue;

		const result = await replaceEditorUrls(data.instructions);
		if (!result.changed) continue;

		await doc.ref.update({
			instructions: result.updated,
			updatedAt: new Date().toISOString(),
		});
		updatedCount++;
	}

	return updatedCount;
}

async function main() {
	const [contentUpdated, articlesUpdated, homesUpdated] = await Promise.all([
		migrateContentCollection(),
		migrateArticles(),
		migrateHomes(),
	]);

	console.log("Editor upload permission migration complete.");
	console.log(`content updated: ${contentUpdated}`);
	console.log(`articles updated: ${articlesUpdated}`);
	console.log(`homes updated: ${homesUpdated}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
