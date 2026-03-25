import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import { getHomesForUser } from "../../utils/homes";
import { buildDocumentProcessingId } from "../../utils/documentProcessing";

interface SearchDocumentResponseItem {
	id: string;
	name: string;
	type: string;
	context: string;
	to: string;
	usageKey: string;
	icon: string;
	updatedAt?: string;
	description?: string;
	keywords?: string[];
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

const normalizeText = (text: string) => text
	.toLowerCase()
	.normalize("NFD")
	.replace(/[\u0300-\u036f]/g, "")
	.replace(/ä/g, "a")
	.replace(/ö/g, "o")
	.replace(/ü/g, "u")
	.replace(/ß/g, "ss");

const matchesQuery = (query: string, values: Array<string | undefined>) => {
	const normalizedTerms = normalizeText(query).trim().split(/\s+/).filter(Boolean);
	if (!normalizedTerms.length) return false;

	const haystack = values
		.filter(Boolean)
		.map((value) => normalizeText(value || ""))
		.join(" ");

	return normalizedTerms.every((term) => haystack.includes(term));
};

const getFileIcon = (type: string) => {
	if (type?.startsWith("image/")) return "i-lucide-image";
	if (type?.includes("pdf")) return "i-lucide-file-text";
	return "i-lucide-file";
};

const buildGlobalDocumentRoute = (folderId: string | null, fileId: string) => {
	const params = new URLSearchParams({ fileId });
	if (folderId) params.set("folder", folderId);
	return `/documents?${params.toString()}`;
};

const buildFolderPath = (foldersById: Map<string, SearchableGlobalFolder>, folderId: string | null) => {
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
};

const getLocalizedProcessingValues = (
	processing: SearchableDocumentProcessing | undefined,
	locale: string,
) => {
	const localized = locale !== "de" ? processing?.translations?.[locale] : undefined;
	return {
		searchText: localized?.searchText || processing?.searchText || "",
		searchSummary: localized?.searchSummary || processing?.searchSummary || "",
		keywords: processing?.searchKeywords || [],
	};
};

const loadProcessingMap = async (ids: string[]) => {
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
};

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!claims.reader && !claims.publisher && !claims.owner && !claims.admin) {
		throw createError({ statusCode: 403, message: "Access denied" });
	}

	const query = ((getQuery(event).q as string) || "").trim();
	const locale = ((getQuery(event).locale as string) || "de").trim();
	if (!query) {
		return { documents: [] as SearchDocumentResponseItem[] };
	}

	const [foldersSnapshot, filesSnapshot] = await Promise.all([
		db.collection("globalFolders").get(),
		db.collection("globalFiles").orderBy("uploadedAt", "desc").limit(500).get(),
	]);

	const folders = foldersSnapshot.docs.map((doc) => ({
		id: doc.id,
		...(doc.data() as Omit<SearchableGlobalFolder, "id">),
	}));
	const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
	const globalProcessing = await loadProcessingMap(
		filesSnapshot.docs.map((document) => buildDocumentProcessingId("global", document.id)),
	);

	const globalDocuments = filesSnapshot.docs
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
				context: folderPath ? `Gemeinsame Dokumente · ${folderPath}` : "Gemeinsame Dokumente",
				to: buildGlobalDocumentRoute(file.folderId || null, file.id),
				usageKey: `global-document:${file.id}`,
				icon: getFileIcon(file.type),
				updatedAt: file.updatedAt || file.uploadedAt,
				description: localized.searchSummary || file.searchSummary || file.name,
				keywords: localized.keywords.length ? localized.keywords : file.searchKeywords || [],
				searchText: localized.searchText || file.searchText || "",
			};
		})
		.filter((file) => matchesQuery(query, [file.name, file.context, file.description, file.searchText, ...(file.keywords || [])]));

	const ownerDocuments: SearchDocumentResponseItem[] = [];

	if (claims.owner || claims.admin) {
		const homes = await getHomesForUser(claims.uid);
		const ownerFiles = homes.flatMap((home) => [...(home.files || []), ...(home.privateFiles || [])].map((file) => ({
			homeId: home.id,
			homeName: home.name,
			file,
		})));
		const ownerProcessing = await loadProcessingMap(
			ownerFiles.map(({ homeId, file }) => buildDocumentProcessingId("owner", file.id, homeId)),
		);

		for (const home of homes) {
			for (const file of [...(home.files || []), ...(home.privateFiles || [])]) {
				if (!file.storagePath) continue;

				const searchSummary = (file as any).searchSummary as string | undefined;
				const searchText = (file as any).searchText as string | undefined;
				const searchKeywords = ((file as any).searchKeywords as string[] | undefined) || [];
				const processing = ownerProcessing.get(buildDocumentProcessingId("owner", file.id, home.id));
				const localized = getLocalizedProcessingValues(processing, locale);

				if (!matchesQuery(query, [
					file.name,
					home.name,
					localized.searchSummary || searchSummary,
					localized.searchText || searchText,
					...(localized.keywords.length ? localized.keywords : searchKeywords),
				])) {
					continue;
				}

				ownerDocuments.push({
					id: `owner-${file.id}`,
					name: file.name,
					type: file.type,
					context: `Eigentümer-Dokumente · ${home.name}`,
					to: `/owner/documents?fileId=${file.id}`,
					usageKey: `owner-document:${home.id}:${file.id}`,
					icon: getFileIcon(file.type),
					updatedAt: file.updatedAt || file.uploadedAt,
					description: localized.searchSummary || searchSummary || file.name,
					keywords: localized.keywords.length ? localized.keywords : searchKeywords,
				});
			}
		}
	}

	const documents = [...ownerDocuments, ...globalDocuments]
		.sort((a, b) => Date.parse(b.updatedAt || "") - Date.parse(a.updatedAt || ""))
		.slice(0, 24);

	return { documents };
});
