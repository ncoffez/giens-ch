import { db, storage } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!claims.admin) {
		throw createError({ statusCode: 403, message: "Only admins can upload files" });
	}

	const body = await readBody(event);
	const { file: base64Data, name, type, size, folderId, lastModified } = body;

	if (!base64Data || !name) {
		throw createError({ statusCode: 400, message: "File data and name are required" });
	}

	if (size && size > MAX_FILE_SIZE) {
		throw createError({ statusCode: 400, message: "File too large. Maximum 50MB allowed." });
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

	await file.save(buffer, {
		metadata: {
			contentType: mimeType,
			metadata: {
				uploadedBy: claims.uid,
			},
		},
	});

	const fileRecord = {
		id: fileId,
		name,
		type: mimeType,
		size: size || buffer.length,
		storagePath,
		folderId: folderId || null,
		uploadedAt: new Date().toISOString(),
		uploadedBy: claims.uid,
		lastModified: typeof lastModified === "number" ? lastModified : undefined,
	};

	await db.collection("globalFiles").doc(fileId).set(fileRecord);

	return fileRecord;
});
