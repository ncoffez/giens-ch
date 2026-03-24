import { db } from "../useFirebaseAdmin";

interface ContentDocument {
	id: string;
	content: string;
}

interface SearchHeading {
	id: string;
	text: string;
	context: string;
	page: string;
	pagePath: string;
}

interface SearchFeature {
	id: string;
	title: string;
	description: string;
}

interface SearchTimeline {
	id: string;
	title: string;
	description: string;
	date: string;
}

const SEARCH_CONTENT_CONFIG = [
	{ id: "organisatorisches", kind: "heading", page: "Organisatorisches", pagePath: "/organisatorisches" },
	{ id: "index-miteinander", kind: "heading", page: "Home", pagePath: "/" },
	{ id: "travel-lage", kind: "heading", page: "Travel", pagePath: "/travel" },
	{ id: "travel-auto", kind: "heading", page: "Travel", pagePath: "/travel#mit-dem-auto" },
	{ id: "travel-zug", kind: "heading", page: "Travel", pagePath: "/travel#mit-dem-zug" },
	{ id: "travel-flugzeug", kind: "heading", page: "Travel", pagePath: "/travel#mit-dem-flugzeug" },
	{ id: "travel-freizeit", kind: "heading", page: "Entdecken", pagePath: "/entdecken#freizeit" },
	{ id: "travel-maerkte", kind: "heading", page: "Entdecken", pagePath: "/entdecken#maerkte" },
	{ id: "travel-einkauf", kind: "heading", page: "Entdecken", pagePath: "/entdecken#einkauf" },
	{ id: "travel-ausfluege", kind: "heading", page: "Entdecken", pagePath: "/entdecken#ausfluege" },
	{ id: "index-features", kind: "feature" },
	{ id: "index-timeline", kind: "timeline", prefix: "timeline" },
] as const;

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/ä/g, "ae")
		.replace(/ö/g, "oe")
		.replace(/ü/g, "ue")
		.replace(/ß/g, "ss")
		.replace(/é/g, "e")
		.replace(/è/g, "e")
		.replace(/ê/g, "e")
		.replace(/à/g, "a")
		.replace(/ù/g, "u")
		.replace(/ç/g, "c")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

function stripHtml(html: string): string {
	if (!html) return "";

	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function extractLocalizedContent(raw: any, locale: string): string {
	if (!raw) return "";

	if (typeof raw.content === "object" && raw.content?.de !== undefined) {
		return locale === "fr" ? raw.content.fr || raw.content.de || "" : raw.content.de || "";
	}

	const germanContent = raw.content || "";
	const frenchContent = raw.translated?.fr || "";
	return locale === "fr" ? frenchContent || germanContent : germanContent;
}

function extractHeadingsFromHtml(html: string, page: string, pagePath: string): SearchHeading[] {
	if (!html) return [];

	const headings: SearchHeading[] = [];
	const headingRegex = /<h[1-4][^>]*>(.*?)<\/h[1-4]>/gi;
	let match: RegExpExecArray | null;

	while ((match = headingRegex.exec(html)) !== null) {
		const headingText = stripHtml(match[1] || "");
		if (!headingText || headingText.length <= 2) continue;

		const nextContent = html.substring(match.index + match[0].length, match.index + match[0].length + 200);
		headings.push({
			id: slugify(headingText),
			text: headingText,
			context: stripHtml(nextContent).substring(0, 100),
			page,
			pagePath,
		});
	}

	return headings;
}

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const locale = (query.locale as string) || "de";

	const documents = await Promise.all(
		SEARCH_CONTENT_CONFIG.map(async (entry) => {
			const snapshot = await db.collection("content").doc(entry.id).get();
			if (!snapshot.exists) {
				return { id: entry.id, content: "" } satisfies ContentDocument;
			}

			return {
				id: entry.id,
				content: extractLocalizedContent(snapshot.data(), locale),
			} satisfies ContentDocument;
		}),
	);

	const contentById = new Map(documents.map((document) => [document.id, document.content]));
	const headings: SearchHeading[] = [];
	const features: SearchFeature[] = [];
	const timeline: SearchTimeline[] = [];

	for (const entry of SEARCH_CONTENT_CONFIG) {
		const content = contentById.get(entry.id) || "";

		if (entry.kind === "heading") {
			headings.push(...extractHeadingsFromHtml(content, entry.page, entry.pagePath));
			continue;
		}

		try {
			const parsed = JSON.parse(content);
			if (!Array.isArray(parsed)) continue;

			if (entry.kind === "feature") {
				for (const [index, item] of parsed.entries()) {
					if (!item?.title) continue;
					features.push({
						id: `feature-${index}`,
						title: item.title,
						description: item.description || "",
					});
				}
				continue;
			}

			for (const [index, item] of parsed.entries()) {
				if (!item?.title) continue;
				timeline.push({
					id: `${entry.prefix}-${index}`,
					title: item.title,
					description: item.description || "",
					date: item.date || "",
				});
			}
		} catch {
		}
	}

	return {
		headings,
		features,
		timeline,
	};
});
