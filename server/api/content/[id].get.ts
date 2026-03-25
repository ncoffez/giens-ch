import { db } from "../../useFirebaseAdmin";
import { formatContentDocument } from "../../utils/content";

export default defineEventHandler(async (event) => {
	try {
		const contentId = event.context.params?.id;
		const query = getQuery(event);
		const locale = (query.locale as string) || "de";

		if (!contentId) {
			throw createError({ statusCode: 400, message: "Content ID is required" });
		}

		const doc = await db.collection("content").doc(contentId).get();
		return formatContentDocument(contentId, doc.exists ? doc.data() : null, locale);
	} catch (e: unknown) {
		throw createError({
			statusCode: (e as any).statusCode || 500,
			message: (e as any).message || "Internal Server Error",
		});
	}
});
