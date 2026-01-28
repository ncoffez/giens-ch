import { auth } from "../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	try {
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];
		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const decodedToken = await auth.verifyIdToken(idToken);
		const uid = decodedToken.uid;

		const body = await readBody(event);
		const { photoURL } = body;

		if (!photoURL) {
			throw createError({ statusCode: 400, message: "No photoURL provided" });
		}

		// Update Firebase Auth profile
		await auth.updateUser(uid, {
			photoURL
		});

		// Update Firestore users collection
		const { db } = await import("../../useFirebaseAdmin");
		await db.collection("users").doc(uid).set({
			photoURL,
			updatedAt: new Date().toISOString()
		}, { merge: true });

		return { success: true, photoURL };
	} catch (error: any) {
		console.error("[Profile Select API Error]:", error);
		throw createError({
			statusCode: error.statusCode || 500,
			message: error.message || "Failed to update profile picture"
		});
	}
});
