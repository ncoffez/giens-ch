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

const articlesCache = ref<SearchArticle[] | null>(null);
const isLoading = ref(false);
const hasLoaded = ref(false);

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

			const data = await $fetch<ArticleMetadata[]>("/api/news", {
				method: "POST",
				body: { all: true },
				headers,
			});

			if (Array.isArray(data)) {
				articlesCache.value = data.map(article => ({
					...article,
					searchText: `${article.title} ${article.intro} ${article.author || ""} ${(article.tags || []).join(" ")}`.toLowerCase(),
				}));
				hasLoaded.value = true;
			}
		} catch (error) {
			console.error("Failed to load articles for search:", error);
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

	const articles = computed(() => articlesCache.value || []);

	return {
		articles,
		isLoading: readonly(isLoading),
		hasLoaded: readonly(hasLoaded),
		loadArticles,
		searchArticles,
	};
}
