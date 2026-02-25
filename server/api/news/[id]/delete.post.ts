import { db, auth } from "../../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	try {
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];

		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const decodedToken = await auth.verifyIdToken(idToken);

		if (!decodedToken.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Admin only" });
		}

		const articleId = getRouterParam(event, "id");
		if (!articleId) {
			throw createError({ statusCode: 400, message: "Article ID required" });
		}

		const articleRef = db.collection("articles").doc(articleId);
		const articleDoc = await articleRef.get();

		if (!articleDoc.exists) {
			throw createError({ statusCode: 404, message: "Article not found" });
		}

		await articleRef.delete();

		return { success: true, id: articleId };
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error"
		});
	}
});
