import { db, storage } from "../../../useFirebaseAdmin";
import { getUserClaims } from "../../../utils/auth";
import { canEditHome } from "../../../utils/homes";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default defineEventHandler(async (event) => {
	const authHeader = getHeader(event, "Authorization");
	if (!authHeader) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const homeId = getRouterParam(event, "id");
	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID required" });
	}

	const canEdit = await canEditHome(homeId, claims.uid, !!claims.admin);
	if (!canEdit) {
		throw createError({ statusCode: 403, message: "Not authorized to edit this home" });
	}

	const body = await readBody(event);
	const { file: base64Data, name, type, size, folderId } = body;

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
	const fileName = `homes/${homeId}/files/${timestamp}-${sanitized}`;

	const bucket = storage.bucket();
	const file = bucket.file(fileName);

	await file.save(buffer, {
		metadata: {
			contentType: mimeType,
			metadata: {
				uploadedBy: claims.uid,
				homeId,
			},
		},
	});

	try {
		await file.makePublic();
	} catch {
		// Ignore if already public via bucket policy
	}

	const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

	const fileRecord = {
		id: fileId,
		name,
		type: mimeType,
		size: size || buffer.length,
		url: publicUrl,
		folderId: folderId || null,
		uploadedAt: new Date().toISOString(),
		uploadedBy: claims.uid,
	};

	const homeRef = db.collection("homes").doc(homeId);
	const homeDoc = await homeRef.get();
	const homeData = homeDoc.data();
	const files = homeData?.files || [];

	await homeRef.update({
		files: [...files, fileRecord],
		updatedAt: new Date().toISOString(),
	});

	return fileRecord;
});