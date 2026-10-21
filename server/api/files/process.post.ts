import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import { buildDocumentProcessingId } from "../../utils/documentProcessing";
import { parseTranslationLanguages, processDocumentJob } from "../../utils/documentProcessingJobs";
import { assertDocumentAction } from "../../utils/permissionAccess";

/**
 * Runs OCR and translation for one uploaded global document (#39). The client
 * calls it right after the upload answered; the work happens inside this
 * request, so it keeps its CPU on Cloud Run.
 */
export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const body = await readBody(event).catch(() => ({})) as { fileId?: unknown; retry?: unknown };
	const fileId = typeof body?.fileId === "string" ? body.fileId.trim() : "";
	if (!fileId) {
		throw createError({ statusCode: 400, message: "File ID is required" });
	}

	const fileDoc = await db.collection("globalFiles").doc(fileId).get();
	if (!fileDoc.exists) {
		throw createError({ statusCode: 404, message: "File not found" });
	}
	await assertDocumentAction(claims, fileDoc.data()?.folderId || null, "upload");

	const config = useRuntimeConfig();
	return await processDocumentJob(buildDocumentProcessingId("global", fileId), {
		geminiApiKey: config.GEMINI_API_KEY,
		geminiModel: config.GEMINI_MODEL,
		translationLanguages: parseTranslationLanguages(config.DOCUMENT_TRANSLATION_LANGUAGES),
		retry: body.retry === true,
	});
});
