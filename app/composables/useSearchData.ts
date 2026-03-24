import { useLocalStorage } from "@vueuse/core";
import {
	searchCollections,
	sortSearchResults,
	type SearchDocument,
	type SearchFeature,
	type SearchHeading,
	type SearchPage,
	type SearchResult,
	type SearchTimeline,
} from "~/utils/search";

interface StoredHeading extends SearchHeading {
	id: string;
	text: string;
	context: string;
	page: string;
	pagePath: string;
}

interface StoredFeature extends SearchFeature {
	id: string;
	title: string;
	description: string;
}

interface StoredTimeline extends SearchTimeline {
	id: string;
	title: string;
	description: string;
	date: string;
}

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
}

interface SearchIndexResponse {
	headings: StoredHeading[];
	features: StoredFeature[];
	timeline: StoredTimeline[];
}

const headingsCache = ref<StoredHeading[]>([]);
const featuresCache = ref<StoredFeature[]>([]);
const timelineCache = ref<StoredTimeline[]>([]);
const documentsCache = ref<StoredDocument[]>([]);
const isLoading = ref(false);
const isLoaded = ref(false);
const loadedLocale = ref<string | null>(null);
const searchUsage = useLocalStorage<Record<string, number>>("search-usage", {});

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

	watch(locale, (newLocale) => {
		if (loadedLocale.value && loadedLocale.value !== newLocale) {
			isLoaded.value = false;
			headingsCache.value = [];
			featuresCache.value = [];
			timelineCache.value = [];
			documentsCache.value = [];
		}
	});

	const loadAllData = async () => {
		if (isLoading.value || (isLoaded.value && loadedLocale.value === locale.value)) return;

		isLoading.value = true;
		try {
			const currentLocale = locale.value;
			const response = await $fetch<SearchIndexResponse>("/api/search-index", {
				query: { locale: currentLocale },
			}).catch(() => null);

			headingsCache.value = response?.headings || [];
			featuresCache.value = response?.features || [];
			timelineCache.value = response?.timeline || [];
			loadedLocale.value = currentLocale;
			isLoaded.value = true;
		} finally {
			isLoading.value = false;
		}
	};

	const loadDocuments = async () => {
		if (!canAccessDocuments.value) return;

		try {
			const { $auth } = useNuxtApp();
			const user = $auth.currentUser;
			if (!user) return;

			const idToken = await user.getIdToken();
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
		}
	};

	const getUsageCount = (usageKey: string) => searchUsage.value?.[usageKey] || 0;

	const getHeadingsByPagePath = (pagePathPrefix: string) => {
		return headingsCache.value.filter((heading) => heading.pagePath.startsWith(pagePathPrefix));
	};

	const searchPages = computed<SearchPage[]>(() => {
		const results: SearchPage[] = [
			{
				id: "page-home",
				label: t("nav.home"),
				context: t("hero.welcome.subtitle"),
				to: "/",
				icon: "i-lucide-house",
				usageKey: "page:/",
				keywords: ["beausoleil", "giens", "residence"],
			},
			{
				id: "page-organisatorisches",
				label: t("nav.organisatorisches"),
				context: t("hero.organisatorisches.subtitle"),
				to: "/organisatorisches",
				icon: "i-lucide-clipboard-list",
				usageKey: "page:/organisatorisches",
				keywords: ["check-in", "wifi", "anreise", "organisation"],
			},
			{
				id: "page-travel",
				label: t("nav.travel"),
				context: t("hero.travel.subtitle"),
				to: "/travel",
				icon: "i-lucide-car",
				usageKey: "page:/travel",
				keywords: ["anreise", "comment venir", "auto", "zug", "flugzeug"],
			},
			{
				id: "page-entdecken",
				label: t("nav.entdecken"),
				context: t("hero.entdecken.subtitle"),
				to: "/entdecken",
				icon: "i-lucide-map",
				usageKey: "page:/entdecken",
				keywords: ["markte", "märkte", "ausfluge", "ausflüge", "plages", "balades"],
			},
		];

		if (canAccessDocuments.value) {
			results.push({
				id: "page-documents",
				label: t("nav.documents"),
				context: t("search.recommendations.documents"),
				to: "/documents",
				icon: "i-lucide-folder",
				usageKey: "page:/documents",
				keywords: ["files", "dateien", "ordner", "documents"],
			});
		}

		if (canAccessOwnerDocuments.value) {
			results.push({
				id: "page-owner-documents",
				label: t("ownerDocuments.title"),
				context: t("ownerDocuments.subtitle"),
				to: "/owner/documents",
				icon: "i-lucide-files",
				usageKey: "page:/owner/documents",
				keywords: ["owner", "proprietaire", "eigentuemer", "eigentümer"],
			});
		}

		if (isOwner.value) {
			results.push({
				id: "page-my-homes",
				label: t("nav.myHomes"),
				context: t("share.guestIntro"),
				to: "/my-homes",
				icon: "i-lucide-building-2",
				usageKey: "page:/my-homes",
				keywords: ["hauser", "häuser", "homes", "maisons"],
			});
		}

		if (import.meta.client && nuxtApp.$currentUser?.value) {
			results.push({
				id: "page-profile",
				label: t("nav.profile"),
				context: t("auth.accountSettings"),
				to: "/profile/me",
				icon: "i-lucide-user",
				usageKey: "page:/profile/me",
				keywords: ["profil", "compte", "account"],
			});
		}

		if (isAdmin.value) {
			results.push({
				id: "page-admin",
				label: t("nav.admin"),
				context: t("nav.admin"),
				to: "/admin",
				icon: "i-lucide-settings",
				usageKey: "page:/admin",
				keywords: ["admin", "verwaltung", "administration"],
			});
		}

		if (!(import.meta.client && nuxtApp.$currentUser?.value)) {
			results.push({
				id: "page-login",
				label: t("nav.login"),
				context: t("auth.loginSubtitle"),
				to: "/login",
				icon: "i-lucide-log-in",
				usageKey: "page:/login",
				keywords: ["login", "connexion", "anmelden"],
			});
		}

		return results;
	});

	const searchAll = (query: string): SearchResult[] => {
		if (!query.trim() || !isLoaded.value) return [];

		return searchCollections({
			pages: searchPages.value,
			headings: headingsCache.value,
			features: featuresCache.value,
			timeline: timelineCache.value,
			documents: documentsCache.value,
			query,
			locale: locale.value,
			canAccessDocuments: canAccessDocuments.value,
			getUsageCount,
		});
	};

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
		const recommendedPageResults: SearchResult[] = [
			...searchPages.value.map((result) => ({
				...result,
				type: "page" as const,
			})),
		];

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

		const recommendedPages = recommendedPageResults.map((result) => ({
			...result,
			score: 20 + getUsageCount(result.usageKey) * 10,
		}));

		return sortSearchResults([...recommendedPages, ...documentRecommendations], locale.value, getUsageCount).slice(0, 10);
	};

	const recordSelection = (result: SearchResult) => {
		searchUsage.value = {
			...searchUsage.value,
			[result.usageKey]: getUsageCount(result.usageKey) + 1,
		};
	};

	return {
		isLoading: readonly(isLoading),
		isLoaded: readonly(isLoaded),
		loadAllData,
		loadDocuments,
		searchAll,
		getRecommendations,
		getHeadingsByPagePath,
		recordSelection,
		getDocumentRecommendations,
		canAccessDocuments,
		canAccessOwnerDocuments,
	};
}
