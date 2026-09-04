import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import { canReadGlobalDocuments } from "../../utils/fileAccess";
import { buildDocumentProcessingId } from "../../utils/documentProcessing";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!canReadGlobalDocuments(claims)) {
		throw createError({ statusCode: 403, message: "Access denied" });
	}

	const fileId = getQuery(event).fileId as string | undefined;
	if (!fileId) {
		throw createError({ statusCode: 400, message: "File ID is required" });
	}

	const locale = ((getQuery(event).locale as string) || "de").trim();
	const processingId = buildDocumentProcessingId("global", fileId);
	const document = await db.collection("documentProcessing").doc(processingId).get();

	if (!document.exists) {
		return { processing: null, locale };
	}

	const processing = document.data() as Record<string, any>;
	const localized = locale !== "de" ? processing.translations?.[locale] : null;

	return {
		locale,
		processing: {
			...processing,
			localizedText: localized?.searchText || "",
			localizedSummary: localized?.searchSummary || "",
		},
	};
});
