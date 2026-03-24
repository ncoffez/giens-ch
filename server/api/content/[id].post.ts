import { db, auth } from "../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	try {
		const contentId = event.context.params?.id;

		if (!contentId) {
			throw createError({ statusCode: 400, message: "Content ID is required" });
		}

		const body = await readBody(event);
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];

		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const decodedToken = await auth.verifyIdToken(idToken);

		if (!decodedToken.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Admin access required" });
		}

		const germanContent = body.content || "";

		// Store German content in 'content' field
		// Firebase Translate Extension will auto-create 'content_fr'
		const updateData = {
			content: germanContent,
			updatedAt: new Date().toISOString(),
			updatedBy: decodedToken.uid,
		};

		await db.collection("content").doc(contentId).set(updateData, { merge: true });

		return {
			id: contentId,
			...updateData,
		};
	} catch (e: unknown) {
		console.error("[Content POST] Error:", e);
		throw createError({
			statusCode: (e as any).statusCode || 500,
			message: (e as any).message || "Internal Server Error",
		});
	}
});
