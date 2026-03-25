import { describe, expect, it } from "vitest";
import {
	buildSearchTarget,
	normalizeText,
	searchCollections,
	type SearchDocument,
	type SearchFeature,
	type SearchHeading,
	type SearchPage,
	type SearchTimeline,
} from "~/utils/search";

const pages: SearchPage[] = [
	{
		id: "page-home",
		label: "Home",
		context: "Mediterrane Ruhe und Gemeinschaft",
		to: "/",
		icon: "i-lucide-house",
		usageKey: "page:/",
		keywords: ["beausoleil", "giens"],
	},
	{
		id: "page-organisatorisches",
		label: "Organisatorisches",
		context: "WLAN, Ankunft und Hinweise",
		to: "/organisatorisches",
		icon: "i-lucide-clipboard-list",
		usageKey: "page:/organisatorisches",
		keywords: ["wifi", "check-in"],
	},
	{
		id: "page-travel",
		label: "Comment venir",
		context: "Anreise mit Auto, Zug oder Flug",
		to: "/travel",
		icon: "i-lucide-car",
		usageKey: "page:/travel",
		keywords: ["anreise", "auto", "zug"],
	},
];

const headings: SearchHeading[] = [
	{
		id: "wifi",
		text: "WLAN und Internet",
		context: "Netzwerk, Passwort und Hinweise",
		page: "Organisatorisches",
		pagePath: "/organisatorisches",
	},
	{
		id: "markets",
		text: "Marchés hebdomadaires",
		context: "Märkte und Dorfleben",
		page: "Découvrir",
		pagePath: "/entdecken",
	},
];

const documents: SearchDocument[] = [
	{
		id: "global-house-rules",
		name: "Hausordnung Beausoleil.pdf",
		type: "application/pdf",
		context: "Gemeinsame Dokumente · Reglement",
		to: "/documents?fileId=1",
		usageKey: "global-document:1",
		icon: "i-lucide-file-text",
	},
	{
		id: "owner-budget",
		name: "Budget-2026.xlsx",
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		context: "Eigentümer-Dokument · Haus 7",
		to: "/owner/documents?fileId=2",
		usageKey: "owner-document:7:2",
		icon: "i-lucide-file-spreadsheet",
	},
];

const features: SearchFeature[] = [
	{
		id: "community",
		title: "Gemeinschaftsgut",
		description: "Fahrräder, Strandspielzeug und Bibliothek für alle",
	},
];

const timeline: SearchTimeline[] = [
	{
		id: "foundation",
		title: "Gründung der Résidence",
		description: "Die Gemeinschaft entsteht auf Giens.",
		date: "1979/1980",
	},
];

const search = (query: string, canAccessDocuments = true) => searchCollections({
	pages,
	headings,
	features,
	timeline,
	documents,
	query,
	locale: "de",
	canAccessDocuments,
	getUsageCount: () => 0,
});

describe("search utilities", () => {
	it("normalizes accents and umlauts for matching", () => {
		expect(normalizeText("Marchés & Märkte")).toBe("marches & markte");
	});

	it("returns page matches for typed queries", () => {
		const results = search("comment venir");

		expect(results.some((result) => result.type === "page" && result.to === "/travel")).toBe(true);
	});

	it("finds headings from organisatorisches and other pages", () => {
		const wifiResults = search("wlan");
		const marketResults = search("marches");

		expect(wifiResults.some((result) => result.type === "heading" && result.to === "/organisatorisches#wifi")).toBe(true);
		expect(marketResults.some((result) => result.type === "heading" && result.to === "/entdecken#markets")).toBe(true);
	});

	it("preserves existing section hashes instead of appending duplicate anchors", () => {
		expect(buildSearchTarget("/travel#mit-dem-auto", "anreise-mit-dem-auto")).toBe("/travel#mit-dem-auto");
		expect(buildSearchTarget("/entdecken", "marches-hebdomadaires")).toBe("/entdecken#marches-hebdomadaires");
	});

	it("matches document file names when document access is enabled", () => {
		const results = search("hausordnung");

		expect(results[0]?.type).toBe("document");
		expect(results[0]?.label).toContain("Hausordnung");
	});

	it("excludes document matches when document access is disabled", () => {
		const results = search("budget", false);

		expect(results.some((result) => result.type === "document")).toBe(false);
	});

	it("keeps heading matches available beyond the first 24 mixed results", () => {
		const crowdedPages: SearchPage[] = Array.from({ length: 40 }, (_, index) => ({
			id: `page-${index}`,
			label: `Guide ${index}`,
			context: "Anreise und Check-in Informationen",
			to: `/guide-${index}`,
			icon: "i-lucide-file-text",
			usageKey: `page:/guide-${index}`,
			keywords: ["anreise"],
		}));

		const results = searchCollections({
			pages: crowdedPages,
			headings: [
				{
					id: "arrival-heading",
					text: "Anreise im Detail",
					context: "Alle Schritte für die Ankunft",
					page: "Organisatorisches",
					pagePath: "/organisatorisches",
				},
			],
			features: [],
			timeline: [],
			documents: [],
			query: "anreise",
			locale: "de",
			canAccessDocuments: false,
			getUsageCount: () => 0,
		});

		expect(results.length).toBeGreaterThan(24);
		expect(results.some((result) => result.type === "heading" && result.id === "arrival-heading")).toBe(true);
	});
});
