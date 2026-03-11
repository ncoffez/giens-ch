interface ArticleMetadata {
	id: string;
	title: string;
	intro: string;
	image: string;
	published: string;
	tags: string[];
	author: string | null;
	authorUid: string | null;
	hasAttachments: boolean;
}

interface SearchArticle extends ArticleMetadata {
	searchText: string;
}

interface OrganisatorischesContent {
	id: string;
	content: string;
	updatedAt: string;
	updatedBy: string;
}

interface SearchOrganisatorisches {
	id: string;
	searchText: string;
	label: string;
	description: string;
}

const articlesCache = ref<SearchArticle[] | null>(null);
const organisatorischesCache = ref<SearchOrganisatorisches | null>(null);
const isLoading = ref(false);
const hasLoaded = ref(false);

function stripHtml(html: string): string {
	if (!html) return "";
	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function extractHeadings(html: string): { label: string; description: string }[] {
	if (!html) return [];
	
	const headings: { label: string; description: string }[] = [];
	const headingRegex = /<h[1-4][^>]*>(.*?)<\/h[1-4]>/gi;
	let match;
	
	while ((match = headingRegex.exec(html)) !== null) {
		const headingText = stripHtml(match[1] || "");
		if (headingText) {
			const nextContent = html.substring(match.index + match[0].length, match.index + match[0].length + 200);
			const description = stripHtml(nextContent).substring(0, 100);
			headings.push({
				label: headingText,
				description: description,
			});
		}
	}
	
	return headings.slice(0, 10);
}

export function useSearchData() {
	const nuxtApp = useNuxtApp();
	const token = computed(() => import.meta.client ? nuxtApp.$token?.value : null);

	const loadArticles = async () => {
		if (hasLoaded.value || isLoading.value) return;

		isLoading.value = true;
		try {
			const headers: Record<string, string> = {};
			if (token.value) {
				headers.Authorization = `Bearer ${token.value}`;
			}

			const [articlesData, orgData] = await Promise.all([
				$fetch<ArticleMetadata[]>("/api/news", {
					method: "POST",
					body: { all: true },
					headers,
				}),
				$fetch<OrganisatorischesContent>("/api/organisatorisches"),
			]);

			if (Array.isArray(articlesData)) {
				articlesCache.value = articlesData.map(article => ({
					...article,
					searchText: `${article.title} ${article.intro} ${article.author || ""} ${(article.tags || []).join(" ")}`.toLowerCase(),
				}));
			}

			if (orgData?.content) {
				const plainText = stripHtml(orgData.content);
				const headings = extractHeadings(orgData.content);
				const firstHeadingLabel = headings[0]?.label || "";
				organisatorischesCache.value = {
					id: "organisatorisches",
					searchText: `organisatorisches ${plainText} ${headings.map(h => h.label).join(" ")}`.toLowerCase(),
					label: "Organisatorisches",
					description: firstHeadingLabel || plainText.substring(0, 100) || "Wichtige Informationen zur Résidence",
				};
			}

			hasLoaded.value = true;
		} catch (error) {
			console.error("Failed to load search data:", error);
		} finally {
			isLoading.value = false;
		}
	};

	const searchArticles = (query: string): SearchArticle[] => {
		if (!articlesCache.value || !query.trim()) return [];

		const searchTerms = query.toLowerCase().trim().split(/\s+/);
		
		return articlesCache.value.filter(article => 
			searchTerms.every(term => article.searchText.includes(term))
		);
	};

	const searchOrganisatorisches = (query: string): SearchOrganisatorisches | null => {
		if (!organisatorischesCache.value || !query.trim()) return null;

		const searchTerms = query.toLowerCase().trim().split(/\s+/);
		const matches = searchTerms.every(term => organisatorischesCache.value!.searchText.includes(term));
		
		return matches ? organisatorischesCache.value : null;
	};

	const articles = computed(() => articlesCache.value || []);

	return {
		articles,
		isLoading: readonly(isLoading),
		hasLoaded: readonly(hasLoaded),
		loadArticles,
		searchArticles,
		searchOrganisatorisches,
	};
}
