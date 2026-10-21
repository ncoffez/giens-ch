import { db, storage } from "../../../../useFirebaseAdmin";
import { assertHomeSection } from "../../../../utils/permissionAccess";
import { buildDocumentSearchFieldsFromBuffer } from "../../../../utils/documentSearch";
import { buildPendingDocumentProcessingRecord } from "../../../../utils/documentProcessingJobs";
import { withUploadTiming } from "../../../../utils/uploadTiming";
import { MAX_UPLOAD_BYTES, formatUploadLimit } from "#shared/uploadLimits";
import crypto from "crypto";

export default defineEventHandler(withUploadTiming("/api/homes/[id]/files/upload", async (event, timer) => {
	const homeId = getRouterParam(event, "id");
	const body = await readBody(event);

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	if (!body.file) {
		throw createError({ statusCode: 400, message: "File is required" });
	}

	const { claims } = await assertHomeSection(event, homeId, "home.files.upload");

	if (body.size && body.size > MAX_UPLOAD_BYTES) {
		throw createError({
			statusCode: 400,
			message: `File size exceeds ${formatUploadLimit(MAX_UPLOAD_BYTES)} limit`,
		});
	}

	const now = new Date().toISOString();
	const visibility = body.private ? "private" : "shared";
	const contentType = body.type || "application/octet-stream";

	// Upload to Firebase Storage
	const bucket = storage.bucket();
	const fileId = crypto.randomUUID();
	const storagePath = `homes/${homeId}/${visibility === "private" ? "private-files" : "files"}/${fileId}/${body.name}`;

	const file = bucket.file(storagePath);
	const base64Data = body.file.split(";base64,").pop();
	const buffer = Buffer.from(base64Data, "base64");
	timer.set({ fileSize: buffer.length, contentType });

	await timer.measure("storage", () => file.save(buffer, {
		contentType,
	}));

	// Make the file public
	try {
		await file.makePublic();
	} catch (e) {
		// Ignore if bucket-level access is enabled
		console.warn("[Home Files Upload] Could not make public:", e);
	}

	// Use public URL format
	const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

	const requestedSearch = {
		searchText: typeof body.searchText === "string" ? body.searchText : "",
		searchSummary: typeof body.searchSummary === "string" ? body.searchSummary : body.name,
		searchKeywords: Array.isArray(body.searchKeywords) ? body.searchKeywords : [],
	};
	const searchFields = buildDocumentSearchFieldsFromBuffer({
		name: body.name,
		type: contentType,
		buffer,
		...requestedSearch,
	});

	// Create file record
	const fileRecord = {
		id: fileId,
		name: body.name,
		type: contentType,
		size: body.size || 0,
		url: publicUrl,
		folderId: body.folderId || null,
		uploadedAt: now,
		updatedAt: now,
		uploadedBy: claims.uid,
		lastModified: typeof body.lastModified === "number" ? body.lastModified : undefined,
		storagePath,
		visibility,
		...searchFields,
	};

	const targetCollectionKey = visibility === "private" ? "privateFiles" : "files";

	// OCR and translation run afterwards through /api/homes/[id]/files/process (#39).
	const processingRecord = buildPendingDocumentProcessingRecord({
		scope: "owner",
		fileId,
		homeId,
		visibility,
		name: body.name,
		type: contentType,
		storagePath,
		...searchFields,
		requestedSearch,
	});

	const homeRef = db.collection("homes").doc(homeId);

	await timer.measure("firestore", () => Promise.all([
		// Read and append in one transaction, so parallel uploads never drop a file.
		db.runTransaction(async (transaction) => {
			const snapshot = await transaction.get(homeRef);
			const current = (snapshot.data() || {}) as Record<string, unknown>;
			const existing = Array.isArray(current[targetCollectionKey]) ? current[targetCollectionKey] as unknown[] : [];
			transaction.update(homeRef, {
				[targetCollectionKey]: [...existing, fileRecord],
				updatedAt: new Date().toISOString(),
			});
		}),
		db.collection("documentProcessing").doc(processingRecord.id).set(processingRecord),
	]));

	return fileRecord;
}));
