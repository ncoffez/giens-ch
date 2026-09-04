import { db } from "../../../../useFirebaseAdmin";
import { getUserClaims } from "../../../../utils/auth";
import { buildTranslatedDocumentFileName, buildTranslatedDocumentHtml } from "../../../../utils/documentExport";
import { buildDocumentProcessingId } from "../../../../utils/documentProcessing";
import { getHomeById } from "../../../../utils/homes";
import { canManageHomeFiles } from "../../../../utils/fileAccess";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");
	const fileId = getQuery(event).fileId as string | undefined;
	const locale = ((getQuery(event).locale as string) || "").trim().toLowerCase();

	if (!homeId || !fileId || !locale) {
		throw createError({ statusCode: 400, message: "Home ID, file ID and locale are required" });
	}

	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const home = await getHomeById(homeId);
	if (!canManageHomeFiles(claims, home)) {
		throw createError({ statusCode: 403, message: "Forbidden" });
	}
	if (!home) {
		throw createError({ statusCode: 404, message: "Home not found" });
	}

	const isPrivate = getQuery(event).private === "true";
	const file = (isPrivate ? (home.privateFiles || []) : (home.files || [])).find((entry) => entry.id === fileId);
	if (!file?.storagePath) {
		throw createError({ statusCode: 404, message: "File not found" });
	}

	const processingDocument = await db.collection("documentProcessing").doc(buildDocumentProcessingId("owner", fileId, homeId)).get();
	if (!processingDocument.exists) {
		throw createError({ statusCode: 404, message: "No translated content found for this file" });
	}

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
