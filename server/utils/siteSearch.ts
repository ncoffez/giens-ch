import { db } from "../useFirebaseAdmin";
import type { SearchDocument, SearchFeature, SearchHeading, SearchPage, SearchResult, SearchTimeline } from "../../app/utils/search";
import { searchCollections } from "../../app/utils/search";
import { getHomesForUser } from "./homes";
import { buildDocumentProcessingId } from "./documentProcessing";

interface ContentDocument {
	id: string;
	content: string;
}

interface ContentDocumentEntry {
	id: string;
	kind: "heading" | "feature" | "timeline";
	page?: string;
	pagePath?: string;
	prefix?: string;
}

interface SearchableGlobalFile {
	id: string;
	name: string;
	type: string;
	folderId: string | null;
	uploadedAt: string;
	updatedAt?: string;
	deletedAt?: string;
	searchText?: string;
	searchSummary?: string;
	searchKeywords?: string[];
}

interface SearchableGlobalFolder {
	id: string;
	name: string;
	parentId: string | null;
}

interface SearchableDocumentProcessing {
	searchText?: string;
	searchSummary?: string;
	searchKeywords?: string[];
	translations?: Record<string, {
		searchText?: string;
		searchSummary?: string;
	}>;
}

interface SearchClaims {
	admin?: boolean;
	publisher?: boolean;
	owner?: boolean;
	reader?: boolean;
	uid?: string;
}

interface SearchCatalogOptions {
	locale: string;
	claims: SearchClaims | null;
}

const SEARCH_CONTENT_CONFIG: ContentDocumentEntry[] = [
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
];

const PAGE_TEXT = {
	de: {
		home: { label: "Home", context: "Mediterrane Ruhe und Gemeinschaft auf der Halbinsel Giens" },
		organisatorisches: { label: "Organisatorisches", context: "Wichtige Informationen für Aufenthalt, Ankunft und Alltag" },
		travel: { label: "Anreise", context: "Mit Auto, Zug oder Flugzeug entspannt nach Giens" },
		entdecken: { label: "Entdecken", context: "Märkte, Strände und Lieblingsorte rund um Giens" },
		documents: { label: "Dokumente", context: "Ordner, Dateien und freigegebene Unterlagen" },
		ownerDocuments: { label: "Eigentümer-Dokumente", context: "Alle privaten und hausspezifischen Unterlagen an einem Ort" },
		myHomes: { label: "Meine Häuser", context: "Eigene Häuser, Freigaben und Inhalte verwalten" },
		profile: { label: "Profil", context: "Persönliche Angaben und Kontoeinstellungen" },
		admin: { label: "Verwaltung", context: "Benutzer, Häuser und Systembereiche verwalten" },
		login: { label: "Login", context: "Anmelden und auf geschützte Inhalte zugreifen" },
	},
	fr: {
		home: { label: "Accueil", context: "Calme méditerranéen et communauté sur la presqu'île de Giens" },
		organisatorisches: { label: "Organisation", context: "Informations importantes pour le séjour, l'arrivée et la vie sur place" },
		travel: { label: "Comment venir", context: "Venir à Giens en voiture, en train ou en avion" },
		entdecken: { label: "Découvrir", context: "Marchés, plages et bonnes adresses autour de Giens" },
		documents: { label: "Documents", context: "Dossiers, fichiers et documents partagés" },
		ownerDocuments: { label: "Documents des propriétaires", context: "Tous les documents privés et liés aux maisons au même endroit" },
		myHomes: { label: "Mes maisons", context: "Gérer ses maisons, partages et contenus" },
		profile: { label: "Profil", context: "Informations personnelles et réglages du compte" },
		admin: { label: "Administration", context: "Gérer les utilisateurs, maisons et paramètres" },
		login: { label: "Connexion", context: "Se connecter pour accéder aux contenus protégés" },
	},
} as const;

function getLocaleKey(locale: string) {
	return locale === "fr" ? "fr" : "de";
}

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

function getLocalizedProcessingValues(
	processing: SearchableDocumentProcessing | undefined,
	locale: string,
) {
	const localized = locale !== "de" ? processing?.translations?.[locale] : undefined;
	return {
		searchText: localized?.searchText || processing?.searchText || "",
		searchSummary: localized?.searchSummary || processing?.searchSummary || "",
		keywords: processing?.searchKeywords || [],
	};
}

async function loadProcessingMap(ids: string[]) {
	if (!ids.length) return new Map<string, SearchableDocumentProcessing>();

	const refs = ids.map((id) => db.collection("documentProcessing").doc(id));
	const snapshots = await db.getAll(...refs);
	const map = new Map<string, SearchableDocumentProcessing>();

	for (const snapshot of snapshots) {
		if (snapshot.exists) {
			map.set(snapshot.id, snapshot.data() as SearchableDocumentProcessing);
		}
	}

	return map;
}

function getFileIcon(type: string) {
	if (type?.startsWith("image/")) return "i-lucide-image";
	if (type?.includes("pdf")) return "i-lucide-file-text";
	return "i-lucide-file";
}

function buildGlobalDocumentRoute(folderId: string | null, fileId: string) {
	const params = new URLSearchParams({ fileId });
	if (folderId) params.set("folder", folderId);
	return `/documents?${params.toString()}`;
}

function buildFolderPath(foldersById: Map<string, SearchableGlobalFolder>, folderId: string | null) {
	if (!folderId) return "";

	const segments: string[] = [];
	let currentFolderId: string | null = folderId;

	while (currentFolderId) {
		const folder = foldersById.get(currentFolderId);
		if (!folder) break;
		segments.unshift(folder.name);
		currentFolderId = folder.parentId;
	}

	return segments.join(" / ");
}

export function buildSearchPages(locale: string, claims: SearchClaims | null): SearchPage[] {
	const copy = PAGE_TEXT[getLocaleKey(locale)];
	const isAuthenticated = Boolean(claims);
	const canAccessDocuments = Boolean(claims?.admin || claims?.publisher || claims?.owner || claims?.reader);
	const canAccessOwnerDocuments = Boolean(claims?.admin || claims?.owner);
	const isOwner = Boolean(claims?.owner || claims?.admin);
	const isAdmin = Boolean(claims?.admin);

	const pages: SearchPage[] = [
		{
			id: "page-home",
			label: copy.home.label,
			context: copy.home.context,
			to: "/",
			icon: "i-lucide-house",
			usageKey: "page:/",
			keywords: ["beausoleil", "giens", "residence"],
		},
		{
			id: "page-organisatorisches",
			label: copy.organisatorisches.label,
			context: copy.organisatorisches.context,
			to: "/organisatorisches",
			icon: "i-lucide-clipboard-list",
			usageKey: "page:/organisatorisches",
			keywords: ["check-in", "wifi", "anreise", "organisation"],
		},
		{
			id: "page-travel",
			label: copy.travel.label,
			context: copy.travel.context,
			to: "/travel",
			icon: "i-lucide-car",
			usageKey: "page:/travel",
			keywords: ["anreise", "comment venir", "auto", "zug", "flugzeug"],
		},
		{
			id: "page-entdecken",
			label: copy.entdecken.label,
			context: copy.entdecken.context,
			to: "/entdecken",
			icon: "i-lucide-map",
			usageKey: "page:/entdecken",
			keywords: ["markte", "märkte", "ausfluge", "ausflüge", "plages", "balades"],
		},
	];

	if (canAccessDocuments) {
		pages.push({
			id: "page-documents",
			label: copy.documents.label,
			context: copy.documents.context,
			to: "/documents",
			icon: "i-lucide-folder",
			usageKey: "page:/documents",
			keywords: ["files", "dateien", "ordner", "documents"],
		});
	}

	if (canAccessOwnerDocuments) {
		pages.push({
			id: "page-owner-documents",
			label: copy.ownerDocuments.label,
			context: copy.ownerDocuments.context,
			to: "/owner/documents",
			icon: "i-lucide-files",
			usageKey: "page:/owner/documents",
			keywords: ["owner", "proprietaire", "eigentuemer", "eigentümer"],
		});
	}

	if (isOwner) {
		pages.push({
			id: "page-my-homes",
			label: copy.myHomes.label,
			context: copy.myHomes.context,
			to: "/my-homes",
			icon: "i-lucide-building-2",
			usageKey: "page:/my-homes",
			keywords: ["hauser", "häuser", "homes", "maisons"],
		});
	}

	if (isAuthenticated) {
		pages.push({
			id: "page-profile",
			label: copy.profile.label,
			context: copy.profile.context,
			to: "/profile/me",
			icon: "i-lucide-user",
			usageKey: "page:/profile/me",
			keywords: ["profil", "compte", "account"],
		});
	}

	if (isAdmin) {
		pages.push({
			id: "page-admin",
			label: copy.admin.label,
			context: copy.admin.context,
			to: "/admin",
			icon: "i-lucide-settings",
			usageKey: "page:/admin",
			keywords: ["admin", "verwaltung", "administration"],
		});
	}

	if (!isAuthenticated) {
		pages.push({
			id: "page-login",
			label: copy.login.label,
			context: copy.login.context,
			to: "/login",
			icon: "i-lucide-log-in",
			usageKey: "page:/login",
			keywords: ["login", "connexion", "anmelden"],
		});
	}

	return pages;
}

export async function loadContentSearchIndex(locale: string) {
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

		if (entry.kind === "heading" && entry.page && entry.pagePath) {
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

			if (entry.kind === "timeline" && entry.prefix) {
				for (const [index, item] of parsed.entries()) {
					if (!item?.title) continue;
					timeline.push({
						id: `${entry.prefix}-${index}`,
						title: item.title,
						description: item.description || "",
						date: item.date || "",
					});
				}
			}
		} catch {
		}
	}

	return { headings, features, timeline };
}

async function loadSearchDocuments(locale: string, claims: SearchClaims | null): Promise<SearchDocument[]> {
	const canAccessDocuments = Boolean(claims?.admin || claims?.publisher || claims?.owner || claims?.reader);
	if (!canAccessDocuments) return [];

	const localeKey = getLocaleKey(locale);
	const sharedLabel = localeKey === "fr" ? "Documents partagés" : "Gemeinsame Dokumente";
	const ownerLabel = localeKey === "fr" ? "Documents des propriétaires" : "Eigentümer-Dokumente";

	const [foldersSnapshot, filesSnapshot] = await Promise.all([
		db.collection("globalFolders").get(),
		db.collection("globalFiles").orderBy("uploadedAt", "desc").get(),
	]);

	const folders = foldersSnapshot.docs.map((doc) => ({
		id: doc.id,
		...(doc.data() as Omit<SearchableGlobalFolder, "id">),
	}));
	const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
	const globalProcessing = await loadProcessingMap(
		filesSnapshot.docs.map((document) => buildDocumentProcessingId("global", document.id)),
	);

	const globalDocuments: SearchDocument[] = filesSnapshot.docs
		.map((doc) => ({
			id: doc.id,
			...(doc.data() as Omit<SearchableGlobalFile, "id">),
		}))
		.filter((file) => !file.deletedAt)
		.map((file) => {
			const folderPath = buildFolderPath(foldersById, file.folderId || null);
			const processing = globalProcessing.get(buildDocumentProcessingId("global", file.id));
			const localized = getLocalizedProcessingValues(processing, locale);

			return {
				id: `global-${file.id}`,
				name: file.name,
				type: file.type,
				description: localized.searchSummary || file.searchSummary || file.name,
				context: folderPath ? `${sharedLabel} · ${folderPath}` : sharedLabel,
				to: buildGlobalDocumentRoute(file.folderId || null, file.id),
				usageKey: `global-document:${file.id}`,
				updatedAt: file.updatedAt || file.uploadedAt,
				icon: getFileIcon(file.type),
				keywords: localized.keywords.length ? localized.keywords : file.searchKeywords || [],
			};
		});

	if (!(claims?.owner || claims?.admin) || !claims.uid) {
		return globalDocuments;
	}

	const homes = await getHomesForUser(claims.uid);
	const ownerFiles = homes.flatMap((home) => [...(home.files || []), ...(home.privateFiles || [])].map((file) => ({
		homeId: home.id,
		homeName: home.name,
		file,
	})));
	const ownerProcessing = await loadProcessingMap(
		ownerFiles.map(({ homeId, file }) => buildDocumentProcessingId("owner", file.id, homeId)),
	);

	const ownerDocuments: SearchDocument[] = [];

	for (const home of homes) {
		for (const file of [...(home.files || []), ...(home.privateFiles || [])]) {
			if (!file.storagePath) continue;

			const searchSummary = (file as any).searchSummary as string | undefined;
			const searchKeywords = ((file as any).searchKeywords as string[] | undefined) || [];
			const processing = ownerProcessing.get(buildDocumentProcessingId("owner", file.id, home.id));
			const localized = getLocalizedProcessingValues(processing, locale);

			ownerDocuments.push({
				id: `owner-${file.id}`,
				name: file.name,
				type: file.type,
				description: localized.searchSummary || searchSummary || file.name,
				context: `${ownerLabel} · ${home.name}`,
				to: `/owner/documents?fileId=${file.id}`,
				usageKey: `owner-document:${home.id}:${file.id}`,
				updatedAt: file.updatedAt || file.uploadedAt,
				icon: getFileIcon(file.type),
				keywords: localized.keywords.length ? localized.keywords : searchKeywords,
			});
		}
	}

	return [...ownerDocuments, ...globalDocuments];
}

export async function buildUnifiedSearchResults(query: string, options: SearchCatalogOptions): Promise<SearchResult[]> {
	const trimmedQuery = query.trim();
	if (!trimmedQuery) return [];

	const [{ headings, features, timeline }, documents] = await Promise.all([
		loadContentSearchIndex(options.locale),
		loadSearchDocuments(options.locale, options.claims),
	]);

	return searchCollections({
		pages: buildSearchPages(options.locale, options.claims),
		headings,
		features,
		timeline,
		documents,
		query: trimmedQuery,
		locale: options.locale,
		canAccessDocuments: Boolean(options.claims?.admin || options.claims?.publisher || options.claims?.owner || options.claims?.reader),
		getUsageCount: () => 0,
	});
}
