import type { PageContent } from "../../types";

export interface StoredContentDocument {
	content?: string | { de?: string; fr?: string };
	translated?: { fr?: string };
	updatedAt?: string;
	updatedBy?: string;
}

export function formatContentDocument(
	contentId: string,
	data: StoredContentDocument | null | undefined,
	locale: string,
): PageContent {
	if (!data) {
		return {
			id: contentId,
			content: "",
			translated: { fr: "" },
			updatedAt: "",
			updatedBy: "",
		};
	}

	if (typeof data.content === "object" && data.content?.de !== undefined) {
		return {
			id: contentId,
			content: locale === "fr" ? (data.content.fr || data.content.de || "") : (data.content.de || ""),
			translated: { fr: data.content.fr || "" },
			updatedAt: data.updatedAt || "",
			updatedBy: data.updatedBy || "",
		};
	}

	const germanContent = data.content || "";
	const frenchContent = data.translated?.fr || "";

	return {
		id: contentId,
		content: locale === "fr" ? (frenchContent || germanContent) : germanContent,
		translated: { fr: frenchContent },
		updatedAt: data.updatedAt || "",
		updatedBy: data.updatedBy || "",
	};
}

export const PUBLIC_PAGE_CONTENT_IDS = {
	home: [
		"index-features",
		"index-miteinander",
		"index-stats",
		"index-timeline",
	],
	travel: [
		"travel-lage",
		"travel-auto",
		"travel-zug",
		"travel-flugzeug",
		"travel-intro-facts",
		"travel-intro-pillars",
		"travel-location-facts",
		"travel-auto-steps",
		"travel-zug-steps",
		"travel-flugzeug-facts",
	],
	entdecken: [
		"travel-freizeit",
		"travel-maerkte",
		"travel-einkauf",
		"travel-ausfluege",
		"travel-freizeit-cards",
		"travel-market-items",
		"travel-shopping-cards",
		"travel-laundry-card",
		"travel-excursion-cards",
		"travel-links",
	],
} as const;

export type PublicPageKey = keyof typeof PUBLIC_PAGE_CONTENT_IDS;

export function permissionKeyForContentId(contentId: string): string | null {
	if (contentId === "organisatorisches") return "page.organisatorisches.edit";
	for (const [page, ids] of Object.entries(PUBLIC_PAGE_CONTENT_IDS) as Array<[PublicPageKey, readonly string[]]>) {
		if (ids.includes(contentId)) {
			if (page === "home") return "page.home.edit";
			if (page === "travel") return "page.travel.edit";
			if (page === "entdecken") return "page.entdecken.edit";
		}
	}
	return null;
}
