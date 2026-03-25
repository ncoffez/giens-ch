import type { PageContent } from "../../../types";
import { db } from "../../useFirebaseAdmin";
import { formatContentDocument, PUBLIC_PAGE_CONTENT_IDS, type PublicPageKey } from "../../utils/content";

export default defineEventHandler(async (event) => {
	const page = event.context.params?.page as PublicPageKey | undefined;
	const query = getQuery(event);
	const locale = (query.locale as string) || "de";

	if (!page || !(page in PUBLIC_PAGE_CONTENT_IDS)) {
		throw createError({ statusCode: 404, message: "Unknown public page content bundle" });
	}

	const contentIds = PUBLIC_PAGE_CONTENT_IDS[page];
	const refs = contentIds.map((contentId) => db.collection("content").doc(contentId));
	const snapshots = await db.getAll(...refs);

	const sections = snapshots.reduce<Record<string, PageContent>>((accumulator, snapshot, index) => {
		const contentId = contentIds[index]!;
		accumulator[contentId] = formatContentDocument(contentId, snapshot.exists ? snapshot.data() : null, locale);
		return accumulator;
	}, {});

	return {
		page,
		sections,
	};
});
