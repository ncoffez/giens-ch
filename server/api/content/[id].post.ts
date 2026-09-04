import { db } from "../../useFirebaseAdmin";
import { requireAdmin } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	try {
		const contentId = event.context.params?.id;

		if (!contentId) {
			throw createError({ statusCode: 400, message: "Content ID is required" });
		}

		const claims = await requireAdmin(event);
		const body = await readBody(event);

		const germanContent = body.content || "";

		// Store German content in 'content' field
		// Firebase Translate Extension will auto-create 'content_fr'
		const updateData = {
			content: germanContent,
			updatedAt: new Date().toISOString(),
			updatedBy: claims.uid,
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
