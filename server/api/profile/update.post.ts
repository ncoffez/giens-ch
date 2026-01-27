import { auth, db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const body = await readBody(event);
	const { displayName } = body;

	if (!displayName || displayName.trim().length < 2) {
		throw createError({ statusCode: 400, message: "Display name must be at least 2 characters long" });
	}

	const uid = claims.uid;

	try {
		// 1. Update Firebase Auth
		await auth.updateUser(uid, { displayName });

		// 2. Sync with existing articles in Firestore (Background task or separate batch)
		const articlesSnapshot = await db.collection("articles")
			.where("authorUid", "==", uid)
			.get();

		if (!articlesSnapshot.empty) {
			const batch = db.batch();
			articlesSnapshot.forEach(doc => {
				batch.update(doc.ref, { author: displayName });
			});
			await batch.commit();
		}

		return { success: true, displayName };
	} catch (error: any) {
		throw createError({
			statusCode: 500,
			message: error.message || "Failed to update profile",
		});
	}
});
