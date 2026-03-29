import { db, storage } from "../../../../useFirebaseAdmin";
import { isHomeOwner, getHomeById } from "../../../../utils/homes";
import { getUserClaims } from "../../../../utils/auth";

const MAX_PHOTOS = 30;

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

	const isOwner = await isHomeOwner(homeId, claims.uid);

	if (!isOwner) {
		throw createError({
			statusCode: 403,
			message: "Forbidden: You cannot upload photos to this home",
		});
	}

	const home = await getHomeById(homeId);
	if (!home) {
		throw createError({ statusCode: 404, message: "Home not found" });
	}

	if ((home.photos?.length || 0) >= MAX_PHOTOS) {
		throw createError({
			statusCode: 400,
			message: `Maximum ${MAX_PHOTOS} photos allowed`,
		});
	}

	// Upload to Firebase Storage
	const bucket = storage.bucket();
	const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
	const storagePath = `homes/${homeId}/photos/${fileName}`;

	const file = bucket.file(storagePath);
	const base64Data = body.file.split(";base64,").pop();

	await file.save(Buffer.from(base64Data, "base64"), {
		contentType: body.type || "image/jpeg",
	});

	// Get signed URL
	const [url] = await file.getSignedUrl({
		action: "read",
		expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
	});

	// Add to home's photos array
	await db
		.collection("homes")
		.doc(homeId)
		.update({
			photos: [...(home.photos || []), url],
			updatedAt: new Date().toISOString(),
		});

	return { url };
});
