import { buildDocumentProcessingId } from "../../../../utils/documentProcessing";
import { parseTranslationLanguages, processDocumentJob } from "../../../../utils/documentProcessingJobs";
import { assertHomeSection } from "../../../../utils/permissionAccess";

/** Runs OCR and translation for one uploaded house file (#39). */
export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");
	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	const body = await readBody(event).catch(() => ({})) as { fileId?: unknown; retry?: unknown };
	const fileId = typeof body?.fileId === "string" ? body.fileId.trim() : "";
	if (!fileId) {
		throw createError({ statusCode: 400, message: "File ID is required" });
	}

	const { home } = await assertHomeSection(event, homeId, "home.files.upload");
	const files = [...((home as any).files || []), ...((home as any).privateFiles || [])];
	if (!files.some((file: { id?: string }) => file?.id === fileId)) {
		throw createError({ statusCode: 404, message: "File not found" });
	}

	const config = useRuntimeConfig();
	return await processDocumentJob(buildDocumentProcessingId("owner", fileId, homeId), {
		geminiApiKey: config.GEMINI_API_KEY,
		geminiModel: config.GEMINI_MODEL,
		translationLanguages: parseTranslationLanguages(config.DOCUMENT_TRANSLATION_LANGUAGES),
		retry: body.retry === true,
	});
});
