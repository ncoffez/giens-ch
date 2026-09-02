import { buildDocumentSearchFields, canExtractDocumentText, extractDocumentText, summarizeSearchText } from "./documentSearch";
import { readZipEntries } from "./zipArchive";

export interface DocumentTranslationRecord {
	searchText: string;
	searchSummary: string;
	translatedAt: string;
	model: string;
}

export interface DocumentProcessingRecord {
	id: string;
	scope: "global" | "owner";
	fileId: string;
	homeId?: string;
	visibility?: "shared" | "private";
	name: string;
	type: string;
	searchText: string;
	searchSummary: string;
	searchKeywords: string[];
	searchUpdatedAt: string;
	extractionSource: "text" | "ooxml" | "gemini" | "metadata";
	ocrApplied: boolean;
	translationLanguages: string[];
	translations?: Record<string, DocumentTranslationRecord>;
}

export interface BuildDocumentProcessingInput {
	scope: "global" | "owner";
	fileId: string;
	homeId?: string;
	visibility?: "shared" | "private";
	name: string;
	type: string;
	buffer: Buffer;
	searchText?: string;
	searchSummary?: string;
	searchKeywords?: string[];
	translationLanguages?: string[];
	geminiApiKey?: string;
	geminiModel?: string;
}

interface ExtractedDocumentText {
	text: string;
	source: DocumentProcessingRecord["extractionSource"];
	ocrApplied: boolean;
}

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 32000;
const MAX_TRANSLATION_CHARS = 12000;
const SUPPORTED_IMAGE_TYPES = new Set([
	"image/heic",
	"image/heif",
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
]);

const collapseWhitespace = (text: string) => text.replace(/\s+/g, " ").trim();

const decodeXmlText = (text: string) => {
	return text
		.replace(/&amp;/g, "&")
		.replace(/&apos;/g, "'")
		.replace(/&gt;/g, ">")
		.replace(/&lt;/g, "<")
		.replace(/&quot;/g, "\"");
};

const stripOfficeXml = (xml: string) => {
	return collapseWhitespace(
		decodeXmlText(
			xml
				.replace(/<w:tab\/>/g, "\t")
				.replace(/<w:br\/>/g, "\n")
				.replace(/<\/w:p>/g, "\n")
				.replace(/<\/(?:row|si)>/g, "\n")
				.replace(/<[^>]+>/g, " "),
		),
	);
};

const getFileExtension = (name: string) => {
	const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
	return match?.[1] || "";
};

const chunkText = (text: string, maxChars: number) => {
	const chunks: string[] = [];
	let current = "";

	for (const paragraph of text.split(/\n{2,}/)) {
		const nextValue = current ? `${current}\n\n${paragraph}` : paragraph;
		if (nextValue.length <= maxChars) {
			current = nextValue;
			continue;
		}

		if (current) {
			chunks.push(current);
			current = "";
		}

		if (paragraph.length <= maxChars) {
			current = paragraph;
			continue;
		}

		for (let index = 0; index < paragraph.length; index += maxChars) {
			chunks.push(paragraph.slice(index, index + maxChars));
		}
	}

	if (current) {
		chunks.push(current);
	}

	return chunks.filter(Boolean);
};

const extractDocxText = (buffer: Buffer) => {
	const entries = readZipEntries(buffer);
	const xmlFiles = Array.from(entries.entries())
		.filter(([name]) => /^word\/(document|header\d+|footer\d+|footnotes|endnotes)\.xml$/i.test(name))
		.map(([, value]) => value.toString("utf8"));

	if (!xmlFiles.length) return "";
	return collapseWhitespace(xmlFiles.map(stripOfficeXml).join("\n"));
};

const extractSharedStrings = (xml: string) => {
	return Array.from(xml.matchAll(/<si[\s\S]*?>([\s\S]*?)<\/si>/g))
		.map((match) => stripOfficeXml(match[1]));
};

const extractXlsxText = (buffer: Buffer) => {
	const entries = readZipEntries(buffer);
	const sharedStringsEntry = entries.get("xl/sharedStrings.xml");
	const sharedStrings = sharedStringsEntry ? extractSharedStrings(sharedStringsEntry.toString("utf8")) : [];
	const worksheetEntries = Array.from(entries.entries())
		.filter(([name]) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name));

	if (!worksheetEntries.length) return "";

	const lines: string[] = [];

	for (const [, value] of worksheetEntries) {
		const xml = value.toString("utf8");
		for (const rowMatch of xml.matchAll(/<row[\s\S]*?>([\s\S]*?)<\/row>/g)) {
			const rowValues: string[] = [];
			for (const cellMatch of rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
				const attributes = cellMatch[1] || "";
				const cellContent = cellMatch[2] || "";
				const valueMatch = cellContent.match(/<v>([\s\S]*?)<\/v>/);
				const inlineMatch = cellContent.match(/<t[^>]*>([\s\S]*?)<\/t>/);
				if (attributes.includes(' t="s"') && valueMatch) {
					const sharedIndex = Number(valueMatch[1]);
					if (!Number.isNaN(sharedIndex) && sharedStrings[sharedIndex]) {
						rowValues.push(sharedStrings[sharedIndex]);
					}
				} else if (inlineMatch) {
					rowValues.push(stripOfficeXml(inlineMatch[1]));
				} else if (valueMatch) {
					rowValues.push(decodeXmlText(valueMatch[1]));
				}
			}

			if (rowValues.length) {
				lines.push(rowValues.join(" | "));
			}
		}
	}

	return collapseWhitespace(lines.join("\n"));
};

const canUseGeminiExtraction = (type: string) => {
	return type === "application/pdf" || SUPPORTED_IMAGE_TYPES.has(type);
};

export const callGemini = async (
	apiKey: string,
	model: string,
	body: Record<string, unknown>,
): Promise<string> => {
	const response = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => "");
		throw new Error(`Gemini API error (${response.status}): ${errorText || response.statusText}`);
	}

	const data = await response.json() as any;
	const text = data.candidates?.[0]?.content?.parts?.map((part: any) => part.text || "").join("").trim();

	if (!text) {
		throw new Error("Gemini returned no text");
	}

	return text;
};

const extractWithGemini = async (
	buffer: Buffer,
	type: string,
	name: string,
	apiKey: string,
	model: string,
) => {
	return await callGemini(apiKey, model, {
		contents: [
			{
				role: "user",
				parts: [
					{
						text: `Extract all readable text from this document named "${name}". Return plain text only. Preserve reading order. If the document is scanned, perform OCR. Do not summarize.`,
					},
					{
						inlineData: {
							mimeType: type,
							data: buffer.toString("base64"),
						},
					},
				],
			},
		],
		generationConfig: {
			temperature: 0,
			topK: 1,
			topP: 1,
			maxOutputTokens: 8192,
		},
	});
};

const translateChunkWithGemini = async (
	text: string,
	targetLanguage: string,
	apiKey: string,
	model: string,
) => {
	return await callGemini(apiKey, model, {
		contents: [
			{
				role: "user",
				parts: [
					{
						text: `Translate the following document text to ${targetLanguage.toUpperCase()}. Return only the translated plain text. Preserve paragraph structure and line breaks where possible.\n\n${text}`,
					},
				],
			},
		],
		generationConfig: {
			temperature: 0.1,
			topK: 1,
			topP: 1,
			maxOutputTokens: 8192,
		},
	});
};

export const buildDocumentProcessingId = (
	scope: "global" | "owner",
	fileId: string,
	homeId?: string,
) => {
	return scope === "owner" ? `owner:${homeId || "unknown"}:${fileId}` : `global:${fileId}`;
};

export async function extractDocumentBody(
	name: string,
	type: string,
	buffer: Buffer,
	options: {
		geminiApiKey?: string;
		geminiModel?: string;
	},
): Promise<ExtractedDocumentText> {
	if (canExtractDocumentText(name, type)) {
		return {
			text: extractDocumentText(name, buffer, type, MAX_TEXT_LENGTH),
			source: "text",
			ocrApplied: false,
		};
	}

	const extension = getFileExtension(name);
	if (extension === "docx") {
		return {
			text: extractDocxText(buffer).slice(0, MAX_TEXT_LENGTH),
			source: "ooxml",
			ocrApplied: false,
		};
	}

	if (extension === "xlsx") {
		return {
			text: extractXlsxText(buffer).slice(0, MAX_TEXT_LENGTH),
			source: "ooxml",
			ocrApplied: false,
		};
	}

	if (options.geminiApiKey && canUseGeminiExtraction(type)) {
		return {
			text: (await extractWithGemini(buffer, type, name, options.geminiApiKey, options.geminiModel || DEFAULT_GEMINI_MODEL))
				.slice(0, MAX_TEXT_LENGTH),
			source: "gemini",
			ocrApplied: type !== "application/pdf",
		};
	}

	return {
		text: "",
		source: "metadata",
		ocrApplied: false,
	};
}

export async function translateDocumentBody(
	text: string,
	targetLanguage: string,
	options: {
		geminiApiKey?: string;
		geminiModel?: string;
	},
): Promise<DocumentTranslationRecord | null> {
	const normalizedText = text.trim();
	if (!normalizedText || !options.geminiApiKey) {
		return null;
	}

	const translatedChunks: string[] = [];
	for (const chunk of chunkText(normalizedText, MAX_TRANSLATION_CHARS)) {
		translatedChunks.push(await translateChunkWithGemini(
			chunk,
			targetLanguage,
			options.geminiApiKey,
			options.geminiModel || DEFAULT_GEMINI_MODEL,
		));
	}

	const translatedText = translatedChunks.join("\n\n").trim();
	if (!translatedText) return null;

	return {
		searchText: translatedText,
		searchSummary: summarizeSearchText(translatedText, targetLanguage.toUpperCase()),
		translatedAt: new Date().toISOString(),
		model: options.geminiModel || DEFAULT_GEMINI_MODEL,
	};
}

export async function buildDocumentProcessingRecord(
	input: BuildDocumentProcessingInput,
): Promise<DocumentProcessingRecord> {
	const extracted = await extractDocumentBody(input.name, input.type, input.buffer, {
		geminiApiKey: input.geminiApiKey,
		geminiModel: input.geminiModel,
	});

	const baseFields = buildDocumentSearchFields({
		name: input.name,
		type: input.type,
		searchText: (input.searchText || "").trim() || extracted.text,
		searchSummary: (input.searchSummary || "").trim() || summarizeSearchText((input.searchText || "").trim() || extracted.text, input.name),
		searchKeywords: input.searchKeywords || [],
	});

	const translationLanguages = (input.translationLanguages || []).filter(Boolean);
	const translations: Record<string, DocumentTranslationRecord> = {};

	for (const language of translationLanguages) {
		const translation = await translateDocumentBody(baseFields.searchText, language, {
			geminiApiKey: input.geminiApiKey,
			geminiModel: input.geminiModel,
		});

		if (translation) {
			translations[language] = translation;
		}
	}

	return {
		id: buildDocumentProcessingId(input.scope, input.fileId, input.homeId),
		scope: input.scope,
		fileId: input.fileId,
		homeId: input.homeId,
		visibility: input.visibility,
		name: input.name,
		type: input.type,
		searchText: baseFields.searchText,
		searchSummary: baseFields.searchSummary,
		searchKeywords: baseFields.searchKeywords,
		searchUpdatedAt: baseFields.searchUpdatedAt,
		extractionSource: extracted.source,
		ocrApplied: extracted.ocrApplied,
		translationLanguages: Object.keys(translations),
		translations: Object.keys(translations).length ? translations : undefined,
	};
}
