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

interface SearchOrganisatorischesHeading {
	id: string;
	heading: string;
	context: string;
	pageLabel: string;
}

interface StoredHeading {
	id: string;
	text: string;
	context: string;
}

const articlesCache = ref<SearchArticle[] | null>(null);
const organisatorischesHeadingsCache = ref<StoredHeading[]>([]);
const isLoading = ref(false);

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/ä/g, "ae")
		.replace(/ö/g, "oe")
		.replace(/ü/g, "ue")
		.replace(/ß/g, "ss")
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

function extractHeadings(html: string): StoredHeading[] {
	if (!html) return [];
	
	const headings: StoredHeading[] = [];
	const headingRegex = /<h[1-4][^>]*>(.*?)<\/h[1-4]>/gi;
	let match;
	
	while ((match = headingRegex.exec(html)) !== null) {
		const headingText = stripHtml(match[1] || "");
		if (headingText) {
			const nextContent = html.substring(match.index + match[0].length, match.index + match[0].length + 200);
			const context = stripHtml(nextContent).substring(0, 100);
			headings.push({
				id: slugify(headingText),
				text: headingText,
				context: context,
			});
		}
	}
	
	return headings;
}

export function useSearchData() {
	const nuxtApp = useNuxtApp();
	const token = computed(() => import.meta.client ? nuxtApp.$token?.value : null);

	const loadArticles = async () => {
		if (isLoading.value) return;

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
				organisatorischesHeadingsCache.value = extractHeadings(orgData.content);
			}
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

	const searchOrganisatorischesHeadings = (query: string): SearchOrganisatorischesHeading[] => {
		if (organisatorischesHeadingsCache.value.length === 0 || !query.trim()) return [];

		const searchTerms = query.toLowerCase().trim().split(/\s+/);
		
		return organisatorischesHeadingsCache.value
			.filter(h => searchTerms.every(term => h.text.toLowerCase().includes(term)))
			.map(h => ({
				id: h.id,
				heading: h.text,
				context: h.context.substring(0, 80),
				pageLabel: "Organisatorisches",
			}));
	};

	const articles = computed(() => articlesCache.value || []);

	return {
		articles,
		isLoading: readonly(isLoading),
		loadArticles,
		searchArticles,
		searchOrganisatorischesHeadings,
	};
}
