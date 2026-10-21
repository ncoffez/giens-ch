import { db, storage } from "../../../../useFirebaseAdmin";
import { getHomeById } from "../../../../utils/homes";
import { assertHomeSection } from "../../../../utils/permissionAccess";
import { withUploadTiming } from "../../../../utils/uploadTiming";
import { MAX_UPLOAD_BYTES, formatUploadLimit } from "#shared/uploadLimits";

const MAX_PHOTOS = 30;

export default defineEventHandler(withUploadTiming("/api/homes/[id]/photos/upload", async (event, timer) => {
	const homeId = getRouterParam(event, "id");
	const body = await readBody(event);

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	if (!body.file) {
		throw createError({ statusCode: 400, message: "File is required" });
	}

	await assertHomeSection(event, homeId, "home.photos.upload");

	const home = await getHomeById(homeId);
	if (!home) {
		throw createError({ statusCode: 404, message: "Home not found" });
	}

	const tooManyPhotos = () => createError({
		statusCode: 400,
		message: `Maximum ${MAX_PHOTOS} photos allowed`,
	});

	if ((home.photos?.length || 0) >= MAX_PHOTOS) {
		throw tooManyPhotos();
	}

	// Upload to Firebase Storage
	const bucket = storage.bucket();
	const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
	const storagePath = `homes/${homeId}/photos/${fileName}`;

	const file = bucket.file(storagePath);
	const base64Data = body.file.split(";base64,").pop();

	const buffer = Buffer.from(base64Data, "base64");
	timer.set({ fileSize: buffer.length, contentType: body.type || "image/jpeg" });

	if (buffer.length > MAX_UPLOAD_BYTES) {
		throw createError({ statusCode: 400, message: `File size exceeds ${formatUploadLimit(MAX_UPLOAD_BYTES)} limit` });
	}

	await timer.measure("storage", () => file.save(buffer, {
		contentType: body.type || "image/jpeg",
	}));

	// Get signed URL
	const [url] = await timer.measure("storage", () => file.getSignedUrl({
		action: "read",
		expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
	}));

	// Read and append in one transaction, so parallel uploads never drop a photo
	// and the limit holds even when several photos arrive at once.
	const homeRef = db.collection("homes").doc(homeId);
	const added = await timer.measure("firestore", () => db.runTransaction(async (transaction) => {
		const snapshot = await transaction.get(homeRef);
		const photos = ((snapshot.data() || {}).photos || []) as string[];
		if (photos.length >= MAX_PHOTOS) return false;

		transaction.update(homeRef, {
			photos: [...photos, url],
			updatedAt: new Date().toISOString(),
		});
		return true;
	}));

	if (!added) {
		await file.delete().catch(() => undefined);
		throw tooManyPhotos();
	}

	return { url };
}));
