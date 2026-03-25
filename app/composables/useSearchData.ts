import { useLocalStorage } from "@vueuse/core";
import { sortSearchResults, type SearchDocument, type SearchResult } from "~/utils/search";

interface StoredDocument extends SearchDocument {
	id: string;
	name: string;
	type: string;
	description?: string;
	context?: string;
	to: string;
	usageKey: string;
	icon?: string;
	updatedAt?: string;
}

interface SearchableGlobalDocument {
	id: string;
	name: string;
	type: string;
	folderId: string | null;
	folderPath?: string;
	uploadedAt?: string;
	deletedAt?: string;
}

const documentsCache = ref<StoredDocument[]>([]);
const searchResults = ref<SearchResult[]>([]);
const isLoadingRecommendations = ref(false);
const isSearching = ref(false);
const searchUsage = useLocalStorage<Record<string, number>>("search-usage", {});
let activeSearchRequest = 0;

export function useSearchData() {
	const nuxtApp = useNuxtApp();
	const { locale, t } = useI18n();

	const isOwner = computed(() => import.meta.client ? nuxtApp.$isOwner?.value ?? false : false);
	const isReader = computed(() => import.meta.client ? nuxtApp.$isReader?.value ?? false : false);
	const isPublisher = computed(() => import.meta.client ? nuxtApp.$isPublisher?.value ?? false : false);
	const isAdmin = computed(() => import.meta.client ? nuxtApp.$isAdmin?.value ?? false : false);
	const canAccessDocuments = computed(() => isOwner.value || isReader.value || isPublisher.value || isAdmin.value);
	const canAccessOwnerDocuments = computed(() => isOwner.value || isAdmin.value);

	const buildGlobalDocumentRoute = (folderId: string | null, fileId: string) => {
		const params = new URLSearchParams({ fileId });
		if (folderId) {
			params.set("folder", folderId);
		}
		return `/documents?${params.toString()}`;
	};

	const loadDocuments = async () => {
		if (!canAccessDocuments.value) return;
		if (isLoadingRecommendations.value) return;

		try {
			isLoadingRecommendations.value = true;
			const idToken = await useNuxtApp().$getAuthToken();
			if (!idToken) return;
			const [globalResponse, ownerResponse] = await Promise.all([
				$fetch<{ files: SearchableGlobalDocument[] }>("/api/files/search", {
					headers: { Authorization: `Bearer ${idToken}` },
				}),
				canAccessOwnerDocuments.value
					? $fetch<{ documents: any[] }>("/api/owner/documents", {
						headers: { Authorization: `Bearer ${idToken}` },
					})
					: Promise.resolve({ documents: [] }),
			]);

			const globalDocuments = (globalResponse?.files || [])
				.filter((file: any) => !file.deletedAt)
				.map((file: any) => ({
					id: `global-${file.id}`,
					name: file.name,
					type: file.type,
					description: file.name,
					context: file.folderPath
						? `${t("search.documentTypes.global")} · ${file.folderPath}`
						: t("search.documentTypes.global"),
					to: buildGlobalDocumentRoute(file.folderId, file.id),
					usageKey: `global-document:${file.id}`,
					updatedAt: file.uploadedAt,
					icon: file.type?.startsWith("image/") ? "i-lucide-image" :
						file.type?.includes("pdf") ? "i-lucide-file-text" :
						"i-lucide-file",
				}));

			const ownerDocuments = (ownerResponse?.documents || []).map((document: any) => ({
				id: `owner-${document.id}`,
				name: document.name,
				type: document.type,
				description: document.name,
				context: `${t("search.documentTypes.owner")} · ${document.homeName}`,
				to: `/owner/documents?fileId=${document.id}`,
				usageKey: `owner-document:${document.homeId}:${document.id}`,
				updatedAt: document.updatedAt || document.uploadedAt,
				icon: document.type?.startsWith("image/") ? "i-lucide-image" :
					document.type?.includes("pdf") ? "i-lucide-file-text" :
					"i-lucide-file",
			}));

			documentsCache.value = [...ownerDocuments, ...globalDocuments];
		} catch {
		} finally {
			isLoadingRecommendations.value = false;
		}
	};

	const searchAll = async (query: string) => {
		const trimmedQuery = query.trim();
		if (!trimmedQuery) {
			searchResults.value = [];
			return;
		}

		const searchId = ++activeSearchRequest;
		isSearching.value = true;

		try {
			const headers: Record<string, string> = {};
			const idToken = await useNuxtApp().$getAuthToken();
			if (idToken) {
				headers.Authorization = `Bearer ${idToken}`;
			}

			const response = await $fetch<{ results: SearchResult[] }>("/api/search", {
				query: { q: trimmedQuery, locale: locale.value },
				headers,
			}).catch(() => null);

			if (searchId === activeSearchRequest) {
				searchResults.value = response?.results || [];
			}
		} catch {
			if (searchId === activeSearchRequest) {
				searchResults.value = [];
			}
		} finally {
			if (searchId === activeSearchRequest) {
				isSearching.value = false;
			}
		}
	};

	const getUsageCount = (usageKey: string) => searchUsage.value?.[usageKey] || 0;

	const getDocumentRecommendations = (): SearchResult[] => {
		return [...documentsCache.value]
			.sort((a, b) => {
				const usageDelta = getUsageCount(b.usageKey) - getUsageCount(a.usageKey);
				if (usageDelta !== 0) return usageDelta;
				return Date.parse(b.updatedAt || "") - Date.parse(a.updatedAt || "");
			})
			.slice(0, 6)
			.map((document) => ({
				id: document.id,
				label: document.name,
				context: document.context,
				to: document.to,
				icon: document.icon,
				type: "document" as const,
				usageKey: document.usageKey,
				score: 15 + getUsageCount(document.usageKey) * 10,
			}));
	};

	const getRecommendations = (): SearchResult[] => {
		const documentRecommendations: SearchResult[] = [...documentsCache.value]
			.sort((a, b) => getUsageCount(b.usageKey) - getUsageCount(a.usageKey))
			.slice(0, 8)
			.map((document) => ({
				id: document.id,
				label: document.name,
				context: document.context,
				to: document.to,
				icon: document.icon,
				type: "document",
				usageKey: document.usageKey,
				score: 10 + getUsageCount(document.usageKey) * 10,
			}));

		return sortSearchResults([...documentRecommendations], locale.value, getUsageCount).slice(0, 8);
	};

	const recordSelection = (result: SearchResult) => {
		searchUsage.value = {
			...searchUsage.value,
			[result.usageKey]: getUsageCount(result.usageKey) + 1,
		};
	};

	return {
		isLoading: readonly(isLoadingRecommendations),
		isSearching: readonly(isSearching),
		loadDocuments,
		searchAll,
		getRecommendations,
		recordSelection,
		getDocumentRecommendations,
		canAccessDocuments,
		canAccessOwnerDocuments,
		searchResults: readonly(searchResults),
	};
}
