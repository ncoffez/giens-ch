import { db, storage } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import { buildDocumentSearchFieldsFromBuffer } from "../../utils/documentSearch";
import { buildPendingDocumentProcessingRecord } from "../../utils/documentProcessingJobs";
import { assertDocumentAction } from "../../utils/permissionAccess";
import { withUploadTiming } from "../../utils/uploadTiming";
import { MAX_UPLOAD_BYTES, formatUploadLimit } from "#shared/uploadLimits";

export default defineEventHandler(withUploadTiming("/api/files/upload", async (event, timer) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const body = await readBody(event);
	await assertDocumentAction(claims, body?.folderId || null, "upload");
	const { file: base64Data, name, type, size, folderId, lastModified } = body;

	if (!base64Data || !name) {
		throw createError({ statusCode: 400, message: "File data and name are required" });
	}

	if (size && size > MAX_UPLOAD_BYTES) {
		throw createError({
			statusCode: 400,
			message: `File too large. Maximum ${formatUploadLimit(MAX_UPLOAD_BYTES)} allowed.`,
		});
	}

	const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
	if (!matches) {
		throw createError({ statusCode: 400, message: "Invalid file data format" });
	}

	const mimeType = matches[1];
	const base64Content = matches[2];
	const buffer = Buffer.from(base64Content, "base64");
	timer.set({ fileSize: buffer.length, contentType: mimeType });

	if (buffer.length > MAX_UPLOAD_BYTES) {
		throw createError({
			statusCode: 400,
			message: `File too large. Maximum ${formatUploadLimit(MAX_UPLOAD_BYTES)} allowed.`,
		});
	}

	const fileId = crypto.randomUUID();
	const timestamp = Date.now();
	const sanitized = name.replace(/[^a-zA-Z0-9.-]/g, "_");
	const storagePath = `global-files/${timestamp}-${sanitized}`;

	const bucket = storage.bucket();
	const file = bucket.file(storagePath);

	await timer.measure("storage", () => file.save(buffer, {
		metadata: {
			contentType: mimeType,
			metadata: {
				uploadedBy: claims.uid,
			},
		},
	}));

	const requestedSearch = {
		searchText: typeof body.searchText === "string" ? body.searchText : "",
		searchSummary: typeof body.searchSummary === "string" ? body.searchSummary : name,
		searchKeywords: Array.isArray(body.searchKeywords) ? body.searchKeywords : [],
	};
	const searchFields = buildDocumentSearchFieldsFromBuffer({
		name,
		type: mimeType,
		buffer,
		...requestedSearch,
	});

	const fileRecord: Record<string, unknown> = {
		id: fileId,
		name,
		type: mimeType,
		size: size || buffer.length,
		storagePath,
		folderId: folderId || null,
		uploadedAt: new Date().toISOString(),
		uploadedBy: claims.uid,
		lastModified: typeof lastModified === "number" ? lastModified : undefined,
		...searchFields,
	};

	// OCR and translation run afterwards through /api/files/process (#39).
	const processingRecord = buildPendingDocumentProcessingRecord({
		scope: "global",
		fileId,
		name,
		type: mimeType,
		storagePath,
		...searchFields,
		requestedSearch,
	});

	await timer.measure("firestore", () => Promise.all([
		db.collection("globalFiles").doc(fileId).set(fileRecord),
		db.collection("documentProcessing").doc(processingRecord.id).set(processingRecord),
	]));

	return fileRecord;
}));
