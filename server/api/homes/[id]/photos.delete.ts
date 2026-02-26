import { db, auth } from "../../../useFirebaseAdmin";
import { canEditHome } from "../../../utils/homes";
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

		const { photoUrl } = body;

		if (!photoUrl) {
			throw createError({ statusCode: 400, message: "Photo URL is required" });
		}

		const home = await db.collection("homes").doc(homeId).get();
		if (!home.exists) {
			throw createError({ statusCode: 404, message: "Home not found" });
		}

		const currentPhotos = home.data()!.photos || [];
		const currentIndex = currentPhotos.indexOf(photoUrl);

		if (currentIndex === -1) {
			throw createError({ statusCode: 404, message: "Photo not found" });
		}

		currentPhotos.splice(currentIndex, 1);

		await db.collection("homes").doc(homeId).update({
			photos: currentPhotos,
			updatedAt: new Date().toISOString(),
		});

		const storage = getStorage();
		const bucket = storage.bucket();
		const fileName = photoUrl.split(`${bucket.name}/`)[1];

		try {
			await bucket.file(fileName).delete();
		} catch (e: unknown) {
			console.warn("Failed to delete photo from storage:", e);
		}

		const updatedHome = await db.collection("homes").doc(homeId).get();
		return { id: updatedHome.id, ...updatedHome.data() };
	} catch (e: unknown) {
		throw createError({
			statusCode: (e as { statusCode?: number }).statusCode || 500,
			message: e instanceof Error ? e.message : "Internal Server Error",
		});
	}
});