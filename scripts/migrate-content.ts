import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";

interface MigrationDetail {
	id: string;
	status: "migrated" | "skipped" | "error";
	type?: "json" | "html" | "text";
	reason?: string;
	error?: string;
}

interface MigrationReport {
	total: number;
	migrated: number;
	skipped: number;
	errors: number;
	details: MigrationDetail[];
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function translateText(
	text: string,
	sourceLang: string = "de",
	targetLang: string = "fr",
): Promise<{ translatedText: string; success: boolean; error?: string }> {
	if (!GEMINI_API_KEY) {
		console.warn("GEMINI_API_KEY not configured, skipping translation");
		return { translatedText: text, success: false, error: "GEMINI_API_KEY not configured" };
	}

	if (!text || text.trim() === "") {
		return { translatedText: "", success: true };
	}

	try {
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: `You are a professional translator. Translate the following text from ${sourceLang.toUpperCase()} to ${targetLang.toUpperCase()}. 
Preserve all HTML tags exactly as they are. Only output the translated text, nothing else.

Text to translate:
${text}`,
								},
							],
						},
					],
					generationConfig: {
						temperature: 0.1,
						topK: 1,
						topP: 1,
						maxOutputTokens: 8192,
					},
				}),
			},
		);

		if (!response.ok) {
			const errorData = await response.json();
			console.error("Gemini API error:", errorData);
			return { translatedText: text, success: false, error: `Gemini API error: ${response.status}` };
		}

		const data = await response.json();
		const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!translatedText) {
			console.error("No translation returned from Gemini");
			return { translatedText: text, success: false, error: "No translation returned" };
		}

		return { translatedText: translatedText.trim(), success: true };
	} catch (error) {
		console.error("Translation error:", error);
		return { translatedText: text, success: false, error: String(error) };
	}
}

async function translateJsonContent<T>(
	data: T,
	sourceLang: string = "de",
	targetLang: string = "fr",
): Promise<T> {
	if (typeof data === "string") {
		const result = await translateText(data, sourceLang, targetLang);
		return result.translatedText as T;
	}

	if (Array.isArray(data)) {
		const translated: unknown[] = [];
		for (const item of data) {
			translated.push(await translateJsonContent(item, sourceLang, targetLang));
		}
		return translated as T;
	}

	if (typeof data === "object" && data !== null) {
		const translated: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(data)) {
			if (["icon", "bgColor", "iconColor"].includes(key)) {
				translated[key] = value;
			} else {
				translated[key] = await translateJsonContent(value, sourceLang, targetLang);
			}
		}
		return translated as T;
	}

	return data;
}

async function main() {
	console.log("=".repeat(60));
	console.log("Content Migration Script");
	console.log("=".repeat(60));

	// Initialize Firebase Admin
	let serviceAccount: any;
	
	if (process.env.FIREBASE_ADMIN_KEY) {
		try {
			serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
			console.log("Using FIREBASE_ADMIN_KEY environment variable");
		} catch (e) {
			console.error("Failed to parse FIREBASE_ADMIN_KEY environment variable");
			process.exit(1);
		}
	} else {
		const serviceAccountPath = "./serviceAccount.json";
		
		if (!fs.existsSync(serviceAccountPath)) {
			console.error(`Service account file not found: ${serviceAccountPath}`);
			console.error("Please set FIREBASE_ADMIN_KEY environment variable or create serviceAccount.json");
			process.exit(1);
		}

		serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
		console.log("Using serviceAccount.json file");
	}

	initializeApp({
		credential: cert(serviceAccount),
	});

	const db = getFirestore();

	console.log("\nFetching all content documents...");
	const snapshot = await db.collection("content").get();
	
	const report: MigrationReport = {
		total: snapshot.size,
		migrated: 0,
		skipped: 0,
		errors: 0,
		details: [],
	};

	console.log(`Found ${snapshot.size} documents\n`);

	for (const doc of snapshot.docs) {
		const contentId = doc.id;
		const data = doc.data();
		
		// Check if already migrated (content is an object with de/fr keys)
		if (typeof data.content === "object" && data.content !== null && "de" in data.content) {
			report.skipped++;
			report.details.push({
				id: contentId,
				status: "skipped",
				reason: "already migrated",
			});
			console.log(`[SKIPPED] ${contentId} - already migrated`);
			continue;
		}

		// Legacy format - content is a string
		const legacyContent = data.content as string;
		
		if (!legacyContent || legacyContent.trim() === "") {
			report.skipped++;
			report.details.push({
				id: contentId,
				status: "skipped",
				reason: "empty content",
			});
			console.log(`[SKIPPED] ${contentId} - empty content`);
			continue;
		}

		try {
			let frenchContent: string;
			let contentType: "json" | "html" | "text" = "text";

			// Try to parse as JSON (for structured data like feature cards, timeline)
			try {
				const parsedContent = JSON.parse(legacyContent);
				contentType = "json";
				
				console.log(`[MIGRATING] ${contentId} (JSON)...`);
				const translatedData = await translateJsonContent(parsedContent, "de", "fr");
				frenchContent = JSON.stringify(translatedData);
			} catch {
				// Content is plain text/HTML
				contentType = legacyContent.includes("<") ? "html" : "text";
				
				console.log(`[MIGRATING] ${contentId} (${contentType})...`);
				const result = await translateText(legacyContent, "de", "fr");
				frenchContent = result.translatedText;
				
				if (!result.success) {
					console.warn(`[WARNING] Translation failed for ${contentId}: ${result.error}`);
					frenchContent = legacyContent;
				}
			}

			// Save with new structure
			const updateData = {
				content: {
					de: legacyContent,
					fr: frenchContent,
				},
				migratedAt: new Date().toISOString(),
			};

			await db.collection("content").doc(contentId).set(updateData, { merge: true });

			report.migrated++;
			report.details.push({
				id: contentId,
				status: "migrated",
				type: contentType,
			});
			
			console.log(`[MIGRATED] ${contentId}\n`);
		} catch (error) {
			report.errors++;
			report.details.push({
				id: contentId,
				status: "error",
				error: String(error),
			});
			console.error(`[ERROR] ${contentId}:`, error, "\n");
		}
	}

	// Print summary
	console.log("\n" + "=".repeat(60));
	console.log("MIGRATION COMPLETE");
	console.log("=".repeat(60));
	console.log(`Total documents: ${report.total}`);
	console.log(`Migrated: ${report.migrated}`);
	console.log(`Skipped: ${report.skipped}`);
	console.log(`Errors: ${report.errors}`);
	console.log("\nDetails:");
	
	for (const detail of report.details) {
		const status = detail.status.toUpperCase().padEnd(10);
		const type = detail.type ? `(${detail.type})` : "";
		const reason = detail.reason ? ` - ${detail.reason}` : "";
		const error = detail.error ? ` - ERROR: ${detail.error}` : "";
		console.log(`  ${status} ${detail.id}${type}${reason}${error}`);
	}

	console.log("\n" + "=".repeat(60));
}

main().catch(console.error);
