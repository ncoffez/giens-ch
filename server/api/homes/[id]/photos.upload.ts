import { db, auth } from "../../../useFirebaseAdmin";
import { canEditHome, MAX_PHOTOS_PER_HOME } from "../../../utils/homes";
import { getStorage } from "firebase-admin/storage";

export default defineEventHandler(async (event) => {
	try {
		const homeId = getRouterParam(event, "id");
		const body = await readBody(event);
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];

		if (!homeId) {
			throw createError({ statusCode: 400, message: "Home ID is required" });
		}

		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const decodedToken = await auth.verifyIdToken(idToken);

		const canEdit = await canEditHome(homeId, decodedToken.uid, !!decodedToken.admin);
		if (!canEdit) {
			throw createError({ statusCode: 403, message: "Forbidden: You cannot edit this home" });
		}

		const { file } = body;

		if (!file) {
			throw createError({ statusCode: 400, message: "No file provided" });
		}

		if (!file.startsWith("data:image/")) {
			throw createError({ statusCode: 400, message: "Only image files are allowed" });
		}

		const base64Data = file.split(",")[1];
		const buffer = Buffer.from(base64Data, "base64");

		if (buffer.length > 10 * 1024 * 1024) {
			throw createError({ statusCode: 400, message: "File size exceeds 10MB limit" });
		}

		const home = await db.collection("homes").doc(homeId).get();
		if (!home.exists) {
			throw createError({ statusCode: 404, message: "Home not found" });
		}

		const currentPhotos = home.data()!.photos || [];
		if (currentPhotos.length >= MAX_PHOTOS_PER_HOME) {
			throw createError({ statusCode: 400, message: `Maximum ${MAX_PHOTOS_PER_HOME} photos allowed` });
		}

		const storage = getStorage();
		const bucket = storage.bucket();
		const fileName = `homes/${homeId}/photos/${Date.now()}.jpg`;
		const fileUpload = bucket.file(fileName);

		await fileUpload.save(buffer, {
			contentType: "image/jpeg",
		});

		const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

		await db.collection("homes").doc(homeId).update({
			photos: [publicUrl, ...currentPhotos],
			updatedAt: new Date().toISOString(),
		});

		const updatedHome = await db.collection("homes").doc(homeId).get();
		return { id: updatedHome.id, ...updatedHome.data() };
	} catch (e: any) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});