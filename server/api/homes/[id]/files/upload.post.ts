import { db, storage } from "../../../../useFirebaseAdmin";
import { isHomeOwner, getHomeById } from "../../../../utils/homes";
import { getUserClaims } from "../../../../utils/auth";
import { buildDocumentSearchFieldsFromBuffer } from "../../../../utils/documentSearch";
import { buildDocumentProcessingRecord } from "../../../../utils/documentProcessing";
import crypto from "crypto";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");
	const body = await readBody(event);

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	if (!body.file) {
		throw createError({ statusCode: 400, message: "File is required" });
	}

	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const isAdmin = !!claims.admin;
	const isOwner = await isHomeOwner(homeId, claims.uid);

	if (!isAdmin && !isOwner) {
		throw createError({
			statusCode: 403,
			message: "Forbidden: You cannot upload files to this home",
		});
	}

	const home = await getHomeById(homeId);
	if (!home) {
		throw createError({ statusCode: 404, message: "Home not found" });
	}

	if (body.size && body.size > MAX_FILE_SIZE) {
		throw createError({
			statusCode: 400,
			message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
		});
	}

	const now = new Date().toISOString();
	const visibility = body.private ? "private" : "shared";
	const config = useRuntimeConfig();

	// Upload to Firebase Storage
	const bucket = storage.bucket();
	const fileId = crypto.randomUUID();
	const storagePath = `homes/${homeId}/${visibility === "private" ? "private-files" : "files"}/${fileId}/${body.name}`;

	const file = bucket.file(storagePath);
	const base64Data = body.file.split(";base64,").pop();
	const buffer = Buffer.from(base64Data, "base64");

	await file.save(buffer, {
		contentType: body.type || "application/octet-stream",
	});

	// Make the file public
	try {
		await file.makePublic();
	} catch (e) {
		// Ignore if bucket-level access is enabled
		console.warn("[Home Files Upload] Could not make public:", e);
	}

	// Use public URL format
	const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

	// Create file record
	const fileRecord = {
		id: fileId,
		name: body.name,
		type: body.type || "application/octet-stream",
		size: body.size || 0,
		url: publicUrl,
		folderId: body.folderId || null,
		uploadedAt: now,
		updatedAt: now,
		uploadedBy: claims.uid,
		lastModified: typeof body.lastModified === "number" ? body.lastModified : undefined,
		storagePath,
		visibility,
		...buildDocumentSearchFieldsFromBuffer({
			name: body.name,
			type: body.type || "application/octet-stream",
			buffer,
			searchText: typeof body.searchText === "string" ? body.searchText : "",
			searchSummary: typeof body.searchSummary === "string" ? body.searchSummary : body.name,
			searchKeywords: Array.isArray(body.searchKeywords) ? body.searchKeywords : [],
		}),
	};

	const targetCollectionKey = visibility === "private" ? "privateFiles" : "files";
	const processingRecord = await buildDocumentProcessingRecord({
		scope: "owner",
		fileId,
		homeId,
		visibility,
		name: body.name,
		type: body.type || "application/octet-stream",
		buffer,
		searchText: typeof body.searchText === "string" ? body.searchText : "",
		searchSummary: typeof body.searchSummary === "string" ? body.searchSummary : body.name,
		searchKeywords: Array.isArray(body.searchKeywords) ? body.searchKeywords : [],
		translationLanguages: (config.DOCUMENT_TRANSLATION_LANGUAGES || "fr").split(",").map((value: string) => value.trim()).filter(Boolean),
		geminiApiKey: config.GEMINI_API_KEY,
		geminiModel: config.GEMINI_MODEL,
	});

	await Promise.all([
		db
			.collection("homes")
			.doc(homeId)
			.update({
			[targetCollectionKey]: [...((home as any)[targetCollectionKey] || []), fileRecord],
			updatedAt: new Date().toISOString(),
			}),
		db.collection("documentProcessing").doc(processingRecord.id).set(processingRecord),
	]);

	return fileRecord;
});
