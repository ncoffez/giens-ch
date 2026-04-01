import { db, storage } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import { buildDocumentSearchFieldsFromBuffer } from "../../utils/documentSearch";
import { buildDocumentProcessingRecord } from "../../utils/documentProcessing";
import { canManageGlobalDocuments } from "../../utils/globalDocuments";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const ALLOWED_VIDEO_TYPES = ["video/mp4"];

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!canManageGlobalDocuments(claims)) {
		throw createError({ statusCode: 403, message: "Only admins and owners can upload files" });
	}

	const body = await readBody(event);
	const { file: base64Data, name, type, size, folderId, lastModified } = body;

	if (!base64Data || !name) {
		throw createError({ statusCode: 400, message: "File data and name are required" });
	}

	const isVideo = ALLOWED_VIDEO_TYPES.includes(type);
	const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;

	if (size && size > maxSize) {
		throw createError({
			statusCode: 400,
			message: `File too large. Maximum ${isVideo ? "100MB" : "50MB"} allowed.`,
		});
	}

	const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
	if (!matches) {
		throw createError({ statusCode: 400, message: "Invalid file data format" });
	}

	const mimeType = matches[1];
	const base64Content = matches[2];
	const buffer = Buffer.from(base64Content, "base64");

	const fileId = crypto.randomUUID();
	const timestamp = Date.now();
	const sanitized = name.replace(/[^a-zA-Z0-9.-]/g, "_");
	const storagePath = `global-files/${timestamp}-${sanitized}`;

	const bucket = storage.bucket();
	const file = bucket.file(storagePath);
	const config = useRuntimeConfig();

	await file.save(buffer, {
		metadata: {
			contentType: mimeType,
			metadata: {
				uploadedBy: claims.uid,
			},
		},
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
		...buildDocumentSearchFieldsFromBuffer({
			name,
			type: mimeType,
			buffer,
			searchText: typeof body.searchText === "string" ? body.searchText : "",
			searchSummary: typeof body.searchSummary === "string" ? body.searchSummary : name,
			searchKeywords: Array.isArray(body.searchKeywords) ? body.searchKeywords : [],
		}),
	};

	const processingRecord = await buildDocumentProcessingRecord({
		scope: "global",
		fileId,
		name,
		type: mimeType,
		buffer,
		searchText: typeof body.searchText === "string" ? body.searchText : "",
		searchSummary: typeof body.searchSummary === "string" ? body.searchSummary : name,
		searchKeywords: Array.isArray(body.searchKeywords) ? body.searchKeywords : [],
		translationLanguages: (config.DOCUMENT_TRANSLATION_LANGUAGES || "fr").split(",").map((value: string) => value.trim()).filter(Boolean),
		geminiApiKey: config.GEMINI_API_KEY,
		geminiModel: config.GEMINI_MODEL,
	});

	await Promise.all([
		db.collection("globalFiles").doc(fileId).set(fileRecord),
		db.collection("documentProcessing").doc(processingRecord.id).set(processingRecord),
	]);

	return fileRecord;
});
