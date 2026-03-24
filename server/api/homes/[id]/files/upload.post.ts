import { db, storage } from "../../../../useFirebaseAdmin";
import { isHomeOwner, getHomeById } from "../../../../utils/homes";
import { getUserClaims } from "../../../../utils/auth";
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

	// Upload to Firebase Storage
	const bucket = storage.bucket();
	const fileId = crypto.randomUUID();
	const storagePath = `homes/${homeId}/${visibility === "private" ? "private-files" : "files"}/${fileId}/${body.name}`;

	const file = bucket.file(storagePath);
	const base64Data = body.file.split(";base64,").pop();

	await file.save(Buffer.from(base64Data, "base64"), {
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
	};

	const targetCollectionKey = visibility === "private" ? "privateFiles" : "files";

	await db
		.collection("homes")
		.doc(homeId)
		.update({
			[targetCollectionKey]: [...((home as any)[targetCollectionKey] || []), fileRecord],
			updatedAt: new Date().toISOString(),
		});

	return fileRecord;
});
