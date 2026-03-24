import { useLocalStorage } from "@vueuse/core";

interface SearchResult {
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

interface StoredHeading {
	id: string;
	text: string;
	context: string;
	page: string;
	pagePath: string;
}

interface StoredFeature {
	id: string;
	title: string;
	description: string;
}

interface StoredTimeline {
	id: string;
	title: string;
	description: string;
	date: string;
}

interface StoredDocument {
	id: string;
	name: string;
	type: string;
	description?: string;
	context?: string;
	to: string;
	usageKey: string;
	icon?: string;
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

function normalizeText(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/ä/g, "a")
		.replace(/ö/g, "o")
		.replace(/ü/g, "u")
		.replace(/ß/g, "ss");
}

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

	const scoreText = (query: string, values: string[]) => {
		const normalizedQuery = normalizeText(query).trim();
		const normalizedValues = values.map((value) => normalizeText(value || ""));
		let score = 0;

		for (const value of normalizedValues) {
			if (!value) continue;
			if (value === normalizedQuery) score += 120;
			if (value.startsWith(normalizedQuery)) score += 70;
			if (value.includes(normalizedQuery)) score += 35;
		}

		return score;
	};

	const sortResults = (results: SearchResult[]) => {
		return [...results].sort((a, b) => {
			const scoreDelta = (b.score || 0) - (a.score || 0);
			if (scoreDelta !== 0) return scoreDelta;

			const usageDelta = getUsageCount(b.usageKey) - getUsageCount(a.usageKey);
			if (usageDelta !== 0) return usageDelta;

			return a.label.localeCompare(b.label, locale.value === "fr" ? "fr" : "de");
		});
	};

	const searchAll = (query: string): SearchResult[] => {
		if (!query.trim() || !isLoaded.value) return [];

		const searchTerms = normalizeText(query).trim().split(/\s+/);
		const results: SearchResult[] = [];

		const matchesQuery = (text: string) => searchTerms.every((term) => normalizeText(text).includes(term));

		for (const heading of headingsCache.value) {
			if (matchesQuery(heading.text) || matchesQuery(heading.context)) {
				results.push({
					id: heading.id,
					label: heading.text,
					context: heading.context.substring(0, 80),
					to: `${heading.pagePath}#${heading.id}`,
					icon: "i-lucide-heading",
					type: "heading",
					usageKey: `heading:${heading.pagePath}:${heading.id}`,
				});
			}
		}

		for (const feature of featuresCache.value) {
			if (matchesQuery(feature.title) || matchesQuery(feature.description)) {
				results.push({
					id: feature.id,
					label: feature.title,
					context: feature.description.substring(0, 80),
					to: "/#features",
					icon: "i-lucide-star",
					type: "feature",
					usageKey: `feature:${feature.id}`,
				});
			}
		}

		for (const timeline of timelineCache.value) {
			if (matchesQuery(timeline.title) || matchesQuery(timeline.description) || matchesQuery(timeline.date)) {
				results.push({
					id: timeline.id,
					label: timeline.title,
					context: timeline.description.substring(0, 80),
					to: "/#geschichte",
					icon: "i-lucide-clock",
					type: "timeline",
					usageKey: `timeline:${timeline.id}`,
				});
			}
		}

		if (canAccessDocuments.value) {
			for (const document of documentsCache.value) {
				if (matchesQuery(`${document.name} ${document.description || ""} ${document.context || ""}`)) {
					results.push({
						id: document.id,
						label: document.name,
						context: document.context,
						to: document.to,
						icon: document.icon,
						type: "document",
						usageKey: document.usageKey,
					});
				}
			}
		}

		return sortResults(results.map((result) => ({
			...result,
			score:
				scoreText(query, [result.label, result.context || "", ...(result.keywords || [])]) +
				searchTerms.length * 5 +
				getUsageCount(result.usageKey) * 10,
		}))).slice(0, 20);
	};

	const getRecommendations = (): SearchResult[] => {
		const pageResults: SearchResult[] = [
			{
				id: "page-home",
				label: t("nav.home"),
				context: t("hero.welcome.subtitle"),
				to: "/",
				icon: "i-lucide-house",
				type: "page",
				usageKey: "page:/",
			},
			{
				id: "page-organisatorisches",
				label: t("nav.organisatorisches"),
				context: t("hero.organisatorisches.subtitle"),
				to: "/organisatorisches",
				icon: "i-lucide-clipboard-list",
				type: "page",
				usageKey: "page:/organisatorisches",
			},
			{
				id: "page-travel",
				label: t("nav.travel"),
				context: t("hero.travel.subtitle"),
				to: "/travel",
				icon: "i-lucide-car",
				type: "page",
				usageKey: "page:/travel",
			},
			{
				id: "page-entdecken",
				label: t("nav.entdecken"),
				context: t("hero.entdecken.subtitle"),
				to: "/entdecken",
				icon: "i-lucide-map",
				type: "page",
				usageKey: "page:/entdecken",
			},
		];

		if (canAccessDocuments.value) {
			pageResults.push({
				id: "page-documents",
				label: t("nav.documents"),
				context: t("search.recommendations.documents"),
				to: "/documents",
				icon: "i-lucide-folder",
				type: "page",
				usageKey: "page:/documents",
			});
		}

		if (canAccessOwnerDocuments.value) {
			pageResults.push({
				id: "page-owner-documents",
				label: t("ownerDocuments.title"),
				context: t("ownerDocuments.subtitle"),
				to: "/owner/documents",
				icon: "i-lucide-files",
				type: "page",
				usageKey: "page:/owner/documents",
			});
		}

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

		const recommendedPages = pageResults.map((result) => ({
			...result,
			score: 20 + getUsageCount(result.usageKey) * 10,
		}));

		return sortResults([...recommendedPages, ...documentRecommendations]).slice(0, 10);
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
		canAccessDocuments,
		canAccessOwnerDocuments,
	};
}
