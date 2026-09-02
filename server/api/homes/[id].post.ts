import { getHomeById, updateHome, isHomeOwner } from "../../utils/homes";
import { getUserClaims } from "../../utils/auth";
import { detectHtmlLanguage, translateHtml } from "../../utils/htmlTranslation";
import {
	INSTRUCTION_LOCALES,
	buildInstructionsFields,
	detectInstructionsLocale,
	isInstructionsLocale,
	planInstructionsUpdate,
} from "../../utils/homeInstructions";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");
	const body = await readBody(event);

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const isOwner = await isHomeOwner(homeId, claims.uid);

	if (!isOwner) {
		throw createError({
			statusCode: 403,
			message: "Forbidden: You cannot edit this home",
		});
	}

	// The photo array is rewritten wholesale when the gallery order changes, so
	// reject anything that is not a plain list of URLs before it reaches the doc.
	if (body.photos !== undefined) {
		const isPhotoList = Array.isArray(body.photos)
			&& body.photos.every((photo: unknown) => typeof photo === "string" && photo.trim().length > 0);

		if (!isPhotoList) {
			throw createError({ statusCode: 400, message: "Photos must be a list of URLs" });
		}
	}

	// Filter allowed fields. The Anleitung is handled separately below, because its
	// per-locale fields are derived server-side rather than taken from the body.
	const allowedFields = ["name", "photos", "wifiSSID", "wifiPassword", "instructions", "files", "folders", "contacts"];
	const filteredBody: Record<string, unknown> = {};
	for (const key of allowedFields) {
		if (body[key] !== undefined) {
			filteredBody[key] = body[key];
		}
	}

	// The Anleitung can be written in German or French. The owner's source language
	// decides the direction, and the other language is filled in automatically.
	const touchesInstructions = typeof body.instructions === "string"
		|| typeof body.instructionsByLocale === "object" && body.instructionsByLocale !== null
		|| isInstructionsLocale(body.instructionsSourceLocale);

	if (touchesInstructions) {
		const existing = await getHomeById(homeId);
		Object.assign(filteredBody, await resolveInstructions(existing, {
			instructions: typeof body.instructions === "string" ? body.instructions : undefined,
			instructionsByLocale: body.instructionsByLocale,
			instructionsSourceLocale: body.instructionsSourceLocale,
			forceTranslateInstructions: body.forceTranslateInstructions === true,
		}));
	}

	const updated = await updateHome(homeId, filteredBody);
	return updated;
});

async function resolveInstructions(
	existing: Awaited<ReturnType<typeof getHomeById>>,
	incoming: Parameters<typeof planInstructionsUpdate>[1],
): Promise<Record<string, unknown>> {
	const config = useRuntimeConfig();
	const geminiOptions = { apiKey: config.GEMINI_API_KEY, model: config.GEMINI_MODEL };

	// Prefill the source language the first time: the heuristic is free, the model
	// is only asked when the text gives no clear signal.
	if (!incoming.instructionsSourceLocale && !existing?.instructionsSourceLocale) {
		const candidate = incoming.instructionsByLocale?.de
			|| incoming.instructionsByLocale?.fr
			|| incoming.instructions
			|| "";

		let detected: string | null = detectInstructionsLocale(candidate);

		if (!detected) {
			try {
				detected = await detectHtmlLanguage(candidate, INSTRUCTION_LOCALES, geminiOptions);
			} catch (error: unknown) {
				console.error("[homes] Could not detect the Anleitung language:", error);
			}
		}

		if (isInstructionsLocale(detected)) {
			incoming = { ...incoming, instructionsSourceLocale: detected };
		}
	}

	const plan = planInstructionsUpdate(existing, incoming);
	let translated: string | null = null;

	if (plan.shouldTranslate) {
		try {
			translated = await translateHtml(plan.source, plan.targetLocale, geminiOptions);
		} catch (error: unknown) {
			// A failing translation must never block the save; the owner keeps the
			// previous version and can retry with the "translate again" button.
			console.error(`[homes] Could not translate the Anleitung to ${plan.targetLocale}:`, error);
		}
	}

	return buildInstructionsFields(plan, translated);
}
