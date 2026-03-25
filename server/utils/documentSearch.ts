const STOP_WORDS = new Set([
	"de",
	"der",
	"die",
	"das",
	"und",
	"for",
	"the",
	"les",
	"des",
	"pour",
	"mit",
	"von",
	"sur",
	"aux",
	"file",
	"document",
]);

const TEXT_MIME_TYPES = new Set([
	"application/json",
	"application/ld+json",
	"application/xml",
	"application/xhtml+xml",
	"application/x-yaml",
	"application/yaml",
	"application/csv",
	"text/csv",
]);

const TEXT_EXTENSIONS = new Set([
	"csv",
	"html",
	"htm",
	"ics",
	"json",
	"log",
	"md",
	"markdown",
	"txt",
	"tsv",
	"xml",
	"yaml",
	"yml",
]);

const MARKUP_EXTENSIONS = new Set([
	"html",
	"htm",
	"xml",
]);

const HTML_ENTITIES: Record<string, string> = {
	"&amp;": "&",
	"&apos;": "'",
	"&gt;": ">",
	"&lt;": "<",
	"&nbsp;": " ",
	"&quot;": "\"",
};

export interface DocumentSearchInput {
	name: string;
	type?: string;
	searchText?: string;
	searchSummary?: string;
	searchKeywords?: string[];
}

export interface DocumentSearchFields {
	searchText: string;
	searchSummary: string;
	searchKeywords: string[];
	searchUpdatedAt: string;
}

export interface DocumentSearchBufferInput extends DocumentSearchInput {
	buffer: Buffer;
}

const getFileExtension = (name: string) => {
	const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
	return match?.[1] || "";
};

const collapseWhitespace = (text: string) => {
	return text
		.replace(/\u0000/g, " ")
		.replace(/\s+/g, " ")
		.trim();
};

const stripMarkup = (text: string) => {
	const withoutScript = text
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/<[^>]+>/g, " ");

	return collapseWhitespace(
		Object.entries(HTML_ENTITIES).reduce(
			(result, [entity, value]) => result.replaceAll(entity, value),
			withoutScript,
		),
	);
};

export function normalizeSearchText(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/ä/g, "a")
		.replace(/ö/g, "o")
		.replace(/ü/g, "u")
		.replace(/ß/g, "ss")
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

export function canExtractDocumentText(name: string, type?: string): boolean {
	const normalizedType = (type || "").toLowerCase();
	if (normalizedType.startsWith("text/")) return true;
	if (TEXT_MIME_TYPES.has(normalizedType)) return true;
	return TEXT_EXTENSIONS.has(getFileExtension(name));
}

export function buildSearchKeywords(name: string, extraKeywords: string[] = []): string[] {
	const tokens = normalizeSearchText(name)
		.split(/\s+/)
		.filter((token) => token.length > 2 && !STOP_WORDS.has(token));

	return [...new Set([...tokens, ...extraKeywords.filter(Boolean).map((token) => normalizeSearchText(token)).filter(Boolean)])];
}

export function extractDocumentText(name: string, buffer: Buffer, type?: string, maxChars: number = 20000): string {
	if (!buffer.length || !canExtractDocumentText(name, type)) return "";

	const extension = getFileExtension(name);
	const normalizedType = (type || "").toLowerCase();
	const rawText = buffer.toString("utf8");
	const cleanedText = extension && MARKUP_EXTENSIONS.has(extension) || normalizedType.includes("html") || normalizedType.includes("xml")
		? stripMarkup(rawText)
		: collapseWhitespace(rawText);

	return cleanedText.slice(0, maxChars).trim();
}

export function summarizeSearchText(searchText: string, fallbackName: string, maxChars: number = 180): string {
	const cleanedText = collapseWhitespace(searchText);
	if (!cleanedText) return fallbackName.trim();
	if (cleanedText.length <= maxChars) return cleanedText;
	return `${cleanedText.slice(0, maxChars).trim()}...`;
}

export function buildDocumentSearchFields(input: DocumentSearchInput): DocumentSearchFields {
	const searchText = (input.searchText || "").trim();
	const searchSummary = (input.searchSummary || summarizeSearchText(searchText, input.name || "") || input.name || "").trim();
	const searchKeywords = buildSearchKeywords(input.name, input.searchKeywords || []);

	return {
		searchText,
		searchSummary,
		searchKeywords,
		searchUpdatedAt: new Date().toISOString(),
	};
}

export function buildDocumentSearchFieldsFromBuffer(input: DocumentSearchBufferInput): DocumentSearchFields {
	const extractedSearchText = (input.searchText || "").trim() || extractDocumentText(input.name, input.buffer, input.type);

	return buildDocumentSearchFields({
		...input,
		searchText: extractedSearchText,
		searchSummary: (input.searchSummary || "").trim() || summarizeSearchText(extractedSearchText, input.name),
	});
}
