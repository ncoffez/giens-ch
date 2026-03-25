import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import { buildTranslatedDocumentFileName, buildTranslatedDocumentHtml } from "../../utils/documentExport";
import { buildDocumentProcessingId } from "../../utils/documentProcessing";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!claims.reader && !claims.publisher && !claims.owner && !claims.admin) {
		throw createError({ statusCode: 403, message: "Access denied" });
	}

	const fileId = getQuery(event).fileId as string | undefined;
	const locale = ((getQuery(event).locale as string) || "").trim().toLowerCase();

	if (!fileId || !locale) {
		throw createError({ statusCode: 400, message: "File ID and locale are required" });
	}

	const [fileDocument, processingDocument] = await Promise.all([
		db.collection("globalFiles").doc(fileId).get(),
		db.collection("documentProcessing").doc(buildDocumentProcessingId("global", fileId)).get(),
	]);

	if (!fileDocument.exists) {
		throw createError({ statusCode: 404, message: "File not found" });
	}

	if (!processingDocument.exists) {
		throw createError({ statusCode: 404, message: "No translated content found for this file" });
	}

	const file = fileDocument.data() as Record<string, any>;
	const processing = processingDocument.data() as Record<string, any>;
	const translation = locale !== "de" ? processing.translations?.[locale] : null;

	if (!translation?.searchText) {
		throw createError({ statusCode: 404, message: "Requested translation is not available" });
	}

	const fileName = buildTranslatedDocumentFileName(file.name || fileId, locale);
	const html = buildTranslatedDocumentHtml({
		fileName: file.name || fileId,
		locale,
		bodyText: translation.searchText,
		summary: translation.searchSummary || processing.searchSummary || "",
		sourceType: file.type || processing.type || "Dokument",
		generatedAt: new Date().toISOString(),
		translatedAt: translation.translatedAt,
		model: translation.model,
	});

	event.node.res.setHeader("Content-Type", "text/html; charset=utf-8");
	event.node.res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

	return html;
});
