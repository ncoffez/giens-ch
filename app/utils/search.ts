export interface SearchResult {
	id: string;
	label: string;
	context?: string;
	to: string;
	icon?: string;
	type: "page" | "heading" | "feature" | "timeline" | "document";
	usageKey: string;
	keywords?: string[];
	score?: number;
}

export interface SearchPage {
	id: string;
	label: string;
	context?: string;
	to: string;
	icon?: string;
	usageKey: string;
	keywords?: string[];
}

export interface SearchHeading {
	id: string;
	text: string;
	context: string;
	page: string;
	pagePath: string;
}

export interface SearchFeature {
	id: string;
	title: string;
	description: string;
}

export interface SearchTimeline {
	id: string;
	title: string;
	description: string;
	date: string;
}

export interface SearchDocument {
	id: string;
	name: string;
	type: string;
	description?: string;
	context?: string;
	to: string;
	usageKey: string;
	icon?: string;
	updatedAt?: string;
	keywords?: string[];
}

export interface SearchCollections {
	pages: SearchPage[];
	headings: SearchHeading[];
	features: SearchFeature[];
	timeline: SearchTimeline[];
	documents: SearchDocument[];
	query: string;
	locale: string;
	canAccessDocuments: boolean;
	getUsageCount: (usageKey: string) => number;
}

export function buildSearchTarget(pagePath: string, id: string): string {
	const [basePath, existingHash] = pagePath.split("#");
	const anchor = existingHash || id;

	if (!anchor) return basePath || pagePath;

	return `${basePath || pagePath}#${anchor}`;
}

export function normalizeText(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/ä/g, "a")
		.replace(/ö/g, "o")
		.replace(/ü/g, "u")
		.replace(/ß/g, "ss");
}

export function scoreText(query: string, values: string[]): number {
	const normalizedQuery = normalizeText(query).trim();
	if (!normalizedQuery) return 0;

	const normalizedValues = values.map((value) => normalizeText(value || ""));
	let score = 0;

	for (const value of normalizedValues) {
		if (!value) continue;
		if (value === normalizedQuery) score += 120;
		if (value.startsWith(normalizedQuery)) score += 70;
		if (value.includes(normalizedQuery)) score += 35;
	}

	return score;
}

export function matchesSearchTerms(query: string, values: string[]): boolean {
	const searchTerms = normalizeText(query).trim().split(/\s+/).filter(Boolean);
	if (searchTerms.length === 0) return false;

	const haystack = values
		.filter(Boolean)
		.map((value) => normalizeText(value))
		.join(" ");

	return searchTerms.every((term) => haystack.includes(term));
}

export function sortSearchResults(
	results: SearchResult[],
	locale: string,
	getUsageCount: (usageKey: string) => number,
): SearchResult[] {
	return [...results].sort((a, b) => {
		const scoreDelta = (b.score || 0) - (a.score || 0);
		if (scoreDelta !== 0) return scoreDelta;

		const usageDelta = getUsageCount(b.usageKey) - getUsageCount(a.usageKey);
		if (usageDelta !== 0) return usageDelta;

		return a.label.localeCompare(b.label, locale === "fr" ? "fr" : "de");
	});
}

export function searchCollections({
	pages,
	headings,
	features,
	timeline,
	documents,
	query,
	locale,
	canAccessDocuments,
	getUsageCount,
}: SearchCollections): SearchResult[] {
	if (!query.trim()) return [];

	const searchTerms = normalizeText(query).trim().split(/\s+/).filter(Boolean);
	const results: SearchResult[] = [];

	for (const page of pages) {
		if (matchesSearchTerms(query, [page.label, page.context || "", ...(page.keywords || [])])) {
			results.push({
				...page,
				type: "page",
				score: 95 + scoreText(query, [page.label, page.context || "", ...(page.keywords || [])]),
			});
		}
	}

	for (const heading of headings) {
		if (matchesSearchTerms(query, [heading.text, heading.context, heading.page])) {
			results.push({
				id: heading.id,
				label: heading.text,
				context: heading.context.substring(0, 80),
				to: buildSearchTarget(heading.pagePath, heading.id),
				icon: "i-lucide-heading",
				type: "heading",
				usageKey: `heading:${heading.pagePath}:${heading.id}`,
				score: 70 + scoreText(query, [heading.text, heading.context, heading.page]),
			});
		}
	}

	for (const feature of features) {
		if (matchesSearchTerms(query, [feature.title, feature.description])) {
			results.push({
				id: feature.id,
				label: feature.title,
				context: feature.description.substring(0, 80),
				to: "/#features",
				icon: "i-lucide-star",
				type: "feature",
				usageKey: `feature:${feature.id}`,
				score: 55 + scoreText(query, [feature.title, feature.description]),
			});
		}
	}

	for (const entry of timeline) {
		if (matchesSearchTerms(query, [entry.title, entry.description, entry.date])) {
			results.push({
				id: entry.id,
				label: entry.title,
				context: entry.description.substring(0, 80),
				to: "/#geschichte",
				icon: "i-lucide-clock",
				type: "timeline",
				usageKey: `timeline:${entry.id}`,
				score: 50 + scoreText(query, [entry.title, entry.description, entry.date]),
			});
		}
	}

	if (canAccessDocuments) {
		for (const document of documents) {
			if (matchesSearchTerms(query, [
				document.name,
				document.description || "",
				document.context || "",
				...(document.keywords || []),
			])) {
				results.push({
					id: document.id,
					label: document.name,
					context: document.context,
					to: document.to,
					icon: document.icon,
					type: "document",
					usageKey: document.usageKey,
					score: 110 + scoreText(query, [
						document.name,
						document.description || "",
						document.context || "",
						...(document.keywords || []),
					]),
				});
			}
		}
	}

	return sortSearchResults(results.map((result) => ({
		...result,
		score: (result.score || 0) +
			searchTerms.length * 5 +
			getUsageCount(result.usageKey) * 10,
	})), locale, getUsageCount).slice(0, 60);
}
