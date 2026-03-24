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

const headingsCache = ref<StoredHeading[]>([]);
const featuresCache = ref<StoredFeature[]>([]);
const timelineCache = ref<StoredTimeline[]>([]);
const documentsCache = ref<StoredDocument[]>([]);
const isLoading = ref(false);
const isLoaded = ref(false);
const loadedLocale = ref<string | null>(null);
const searchUsage = useLocalStorage<Record<string, number>>("search-usage", {});

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

function stripHtml(html: string): string {
	if (!html) return "";
	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function extractHeadingsFromHtml(html: string, page: string, pagePath: string): StoredHeading[] {
	if (!html) return [];

	const headings: StoredHeading[] = [];
	const headingRegex = /<h[1-4][^>]*>(.*?)<\/h[1-4]>/gi;
	let match;

	while ((match = headingRegex.exec(html)) !== null) {
		const headingText = stripHtml(match[1] || "");
		if (headingText && headingText.length > 2) {
			const nextContent = html.substring(match.index + match[0].length, match.index + match[0].length + 200);
			const context = stripHtml(nextContent).substring(0, 100);
			headings.push({
				id: slugify(headingText),
				text: headingText,
				context,
				page,
				pagePath,
			});
		}
	}

	return headings;
}

export function useSearchData() {
	const nuxtApp = useNuxtApp();
	const { locale, t } = useI18n();

	const isOwner = computed(() => import.meta.client ? nuxtApp.$isOwner : false);
	const isReader = computed(() => import.meta.client ? nuxtApp.$isReader : false);
	const isPublisher = computed(() => import.meta.client ? nuxtApp.$isPublisher : false);
	const isAdmin = computed(() => import.meta.client ? nuxtApp.$isAdmin : false);
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
			const allHeadings: StoredHeading[] = [];
			const allFeatures: StoredFeature[] = [];
			const allTimeline: StoredTimeline[] = [];
			const currentLocale = locale.value;

			const [
				orgData,
				homeFeaturesData,
				homeTimelineData,
				homeMiteinanderData,
				aboutTimelineData,
				aboutIntroData,
				aboutCommunityData,
				travelLageData,
				travelAutoData,
				travelZugData,
				travelFlugzeugData,
				travelFreizeitData,
				travelMaerkteData,
				travelEinkaufData,
				travelAusfluegeData,
			] = await Promise.all([
				$fetch<any>(`/api/content/organisatorisches?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/index-features?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/index-timeline?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/index-miteinander?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/about-timeline?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/about-intro?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/about-community?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-lage?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-auto?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-zug?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-flugzeug?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-freizeit?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-maerkte?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-einkauf?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-ausfluege?locale=${currentLocale}`).catch(() => null),
			]);

			const organisatorischesName = t("nav.organisatorisches");
			const homeName = t("nav.home");
			const aboutName = t("nav.about");
			const travelName = t("nav.travel");

			if (orgData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(orgData.content, organisatorischesName, "/organisatorisches"));
			}
			if (homeMiteinanderData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(homeMiteinanderData.content, homeName, "/"));
			}
			if (aboutIntroData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(aboutIntroData.content, aboutName, "/about"));
			}
			if (aboutCommunityData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(aboutCommunityData.content, aboutName, "/about"));
			}
			if (travelLageData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelLageData.content, travelName, "/travel"));
			}
			if (travelAutoData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelAutoData.content, travelName, "/travel#mit-dem-auto"));
			}
			if (travelZugData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelZugData.content, travelName, "/travel#mit-dem-zug"));
			}
			if (travelFlugzeugData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelFlugzeugData.content, travelName, "/travel#mit-dem-flugzeug"));
			}
			if (travelFreizeitData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelFreizeitData.content, travelName, "/travel#freizeit"));
			}
			if (travelMaerkteData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelMaerkteData.content, travelName, "/travel#maerkte"));
			}
			if (travelEinkaufData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelEinkaufData.content, travelName, "/travel#einkauf"));
			}
			if (travelAusfluegeData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelAusfluegeData.content, travelName, "/travel#ausfluege"));
			}

			if (homeFeaturesData?.content) {
				try {
					const features = JSON.parse(homeFeaturesData.content);
					if (Array.isArray(features)) {
						features.forEach((feature: any, index: number) => {
							if (feature.title) {
								allFeatures.push({
									id: `feature-${index}`,
									title: feature.title,
									description: feature.description || "",
								});
							}
						});
					}
				} catch {
				}
			}

			if (homeTimelineData?.content) {
				try {
					const timeline = JSON.parse(homeTimelineData.content);
					if (Array.isArray(timeline)) {
						timeline.forEach((entry: any, index: number) => {
							if (entry.title) {
								allTimeline.push({
									id: `timeline-${index}`,
									title: entry.title,
									description: entry.description || "",
									date: entry.date || "",
								});
							}
						});
					}
				} catch {
				}
			}

			if (aboutTimelineData?.content) {
				try {
					const timeline = JSON.parse(aboutTimelineData.content);
					if (Array.isArray(timeline)) {
						timeline.forEach((entry: any, index: number) => {
							if (entry.title) {
								allTimeline.push({
									id: `about-timeline-${index}`,
									title: entry.title,
									description: entry.description || "",
									date: entry.date || "",
								});
							}
						});
					}
				} catch {
				}
			}

			headingsCache.value = allHeadings;
			featuresCache.value = allFeatures;
			timelineCache.value = allTimeline;
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
				id: "page-about",
				label: t("nav.about"),
				context: t("hero.about.subtitle"),
				to: "/about",
				icon: "i-lucide-info",
				type: "page",
				usageKey: "page:/about",
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
		recordSelection,
		canAccessDocuments,
		canAccessOwnerDocuments,
	};
}
