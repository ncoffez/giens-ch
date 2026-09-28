import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import { assertDocumentAction } from "../../utils/permissionAccess";
import { buildDocumentProcessingId } from "../../utils/documentProcessing";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const fileId = getQuery(event).fileId as string | undefined;
	if (!fileId) {
		throw createError({ statusCode: 400, message: "File ID is required" });
	}

	const locale = ((getQuery(event).locale as string) || "de").trim();
	const fileDoc = await db.collection("globalFiles").doc(fileId).get();
	if (!fileDoc.exists) {
		throw createError({ statusCode: 404, message: "File not found" });
	}
	await assertDocumentAction(claims, fileDoc.data()?.folderId || null, "open");
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
