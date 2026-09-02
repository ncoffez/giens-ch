import { callGemini } from "./documentProcessing";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export interface TranslateHtmlOptions {
	apiKey?: string;
	model?: string;
}

/** Strips tags to decide whether there is anything worth translating. */
export function hasTranslatableText(html: string | undefined | null): boolean {
	if (!html) return false;

	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/\s+/g, " ")
		.trim()
		.length > 0;
}

/**
 * Removes the code fence Gemini sometimes wraps HTML in, so the stored value is
 * the markup itself and never ```html … ```.
 */
export function stripCodeFence(value: string): string {
	const trimmed = value.trim();
	const fenced = trimmed.match(/^```(?:html)?\s*\n([\s\S]*?)\n?```$/i);

	return (fenced ? fenced[1]! : trimmed).trim();
}

/**
 * Translates rich-text HTML while keeping the markup intact. Returns null when
 * there is nothing to translate or no API key is configured, so callers can fall
 * back to the source language instead of failing the save.
 */
export async function translateHtml(
	html: string,
	targetLanguage: string,
	options: TranslateHtmlOptions,
): Promise<string | null> {
	if (!options.apiKey || !hasTranslatableText(html)) return null;

	const prompt = [
		`Translate the user-visible text of the following HTML fragment to ${targetLanguage.toUpperCase()}.`,
		"Rules:",
		"- Return only the translated HTML fragment, with no explanation and no code fences.",
		"- Keep every tag, attribute, href and image source exactly as they are.",
		"- Translate text content and alt/title attributes only.",
		"- Preserve the original structure, order and formatting.",
		"",
		html,
	].join("\n");

	const translated = await callGemini(options.apiKey, options.model || DEFAULT_GEMINI_MODEL, {
		contents: [{ role: "user", parts: [{ text: prompt }] }],
		generationConfig: {
			temperature: 0.1,
			topK: 1,
			topP: 1,
			maxOutputTokens: 8192,
		},
	});

	const cleaned = stripCodeFence(translated);

	return cleaned || null;
}

/**
 * Asks the model which language a fragment is written in. Only used when the
 * cheap heuristic cannot tell; returns null on anything unexpected so the caller
 * falls back to its default.
 */
export async function detectHtmlLanguage(
	html: string,
	allowed: readonly string[],
	options: TranslateHtmlOptions,
): Promise<string | null> {
	if (!options.apiKey || !hasTranslatableText(html)) return null;

	const prompt = [
		`Which language is the following HTML fragment written in?`,
		`Answer with exactly one of these codes and nothing else: ${allowed.join(", ")}.`,
		"",
		html,
	].join("\n");

	const answer = await callGemini(options.apiKey, options.model || DEFAULT_GEMINI_MODEL, {
		contents: [{ role: "user", parts: [{ text: prompt }] }],
		generationConfig: { temperature: 0, topK: 1, topP: 1, maxOutputTokens: 8 },
	});

	const normalized = answer.trim().toLowerCase().slice(0, 5);
	return allowed.find((code) => normalized.startsWith(code)) || null;
}
