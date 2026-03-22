import { db } from "../../useFirebaseAdmin";

interface ContentResponse {
	id: string;
	content: string;
	updatedAt: string;
	updatedBy: string;
}

export default defineEventHandler(async (event) => {
	try {
		const contentId = event.context.params?.id;

		if (!contentId) {
			throw createError({ statusCode: 400, message: "Content ID is required" });
		}

		const doc = await db.collection("content").doc(contentId).get();

		if (!doc.exists) {
			return {
				id: contentId,
				content: "",
				updatedAt: "",
				updatedBy: "",
			} as ContentResponse;
		}

		return { id: doc.id, ...doc.data() } as ContentResponse;
	} catch (e: unknown) {
		throw createError({
			statusCode: (e as any).statusCode || 500,
			message: (e as any).message || "Internal Server Error",
		});
	}
});
