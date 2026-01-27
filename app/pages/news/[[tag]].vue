<template>
	<div id="news" class="flex flex-col max-w-screen-lg mx-auto px-4 mt-4">
		<UiNewsFilter v-model="filterState" />

		<ClientOnly>
			<div v-if="isAuthorized" key="authorized-view">
				<div id="error" v-if="error" class="py-12">
					<h1 class="text-2xl font-bold">{{ error.statusCode }} - {{ error.name }}</h1>
					<p class="text-neutral-500">{{ error.message }}</p>
				</div>
				<div class="relative">
					<!-- Skeletons (only for initial load) -->
					<template v-if="status === 'pending'">
						<UiSummarySkeleton v-for="i in 5" :key="`skeleton-${i}`" :index="i" />
					</template>

					<!-- Content -->
					<template v-else-if="filteredNews && filteredNews.length > 0">
						<TransitionGroup 
							name="list" 
							tag="div" 
							class="space-y-4 md:space-y-0"
						>
							<UiSummary
								v-for="(article, index) of filteredNews"
								:key="article.id"
								:link="`/article/${article.id}`"
								:id="article.id"
								:title="article.title"
								:subtitle="article.intro"
								:image-url="article.image"
								:labels="article.tags"
								:author="article.author"
								:author-uid="article.authorUid"
								:index="index"
								:date="new Date(article.published).toLocaleDateString('de-CH')" 
							/>
						</TransitionGroup>
					</template>
					<div class="prose py-20 text-center mx-auto" v-else-if="status !== 'pending'">
						<UIcon name="i-lucide-search-x" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
						<p class="text-xl font-bold text-gray-500">Keine Neuigkeiten zum gewählten Thema gefunden.</p>
						<UButton variant="link" @click="filterState = { search: '', tag: 'all', author: 'all', dateRange: 'all' }">Alle Filter zurücksetzen</UButton>
					</div>
				</div>
			</div>
			<div v-else class="py-12" key="not-authorized-view">
				<NotAuthorized :tag="filterState.tag" />
			</div>
			<template #fallback>
				<div class="flex flex-col w-full">
					<UiSummarySkeleton v-for="i in 5" :key="`fallback-skeleton-${i}`" :index="i" />
				</div>
			</template>
		</ClientOnly>
	</div>
</template>

<script lang="ts" setup>
import type { Article } from "~/utils/article";

const route = useRoute();
const router = useRouter();
const tag = route.params.tag as string;
const nuxtApp = useNuxtApp();
const { $token, $isPublisher } = nuxtApp;

const filterState = ref({
	search: (route.query.s as string) || '',
	tag: tag || 'all',
	author: (route.query.a as string) || 'all',
	dateRange: (route.query.d as string) || 'all'
});

// Update URL when filters change
watch(filterState, (newState) => {
	if (import.meta.test) return;

	const query: any = {};
	if (newState.search) query.s = newState.search;
	if (newState.author !== 'all') query.a = newState.author;
	if (newState.dateRange !== 'all') query.d = newState.dateRange;

	const currentPath = route.path;
	const newPath = newState.tag === 'all' ? '/news' : `/news/${newState.tag}`;
	
	// Only navigate if path or query actually changed
	if (currentPath !== newPath || JSON.stringify(route.query) !== JSON.stringify(query)) {
		router.replace({
			path: newPath,
			query
		});
	}
}, { deep: true });

// Sync filter with URL (for back/forward buttons)
watch(() => route.fullPath, () => {
	const newTag = (route.params.tag as string) || 'all';
	const newSearch = (route.query.s as string) || '';
	const newAuthor = (route.query.a as string) || 'all';
	const newDate = (route.query.d as string) || 'all';

	if (filterState.value.tag !== newTag) filterState.value.tag = newTag;
	if (filterState.value.search !== newSearch) filterState.value.search = newSearch;
	if (filterState.value.author !== newAuthor) filterState.value.author = newAuthor;
	if (filterState.value.dateRange !== newDate) filterState.value.dateRange = newDate;
});

// Create a unique key for the fetch
const cacheKey = computed(() => {
	const authStatus = $token.value ? "auth" : "pub";
	return `news-list-all-${authStatus}`;
});

// Fetch labels to determine if tag is private
const { data: labels } = await useFetch<any[]>("/api/labels", {
	key: "labels-list",
	getCachedData(key) {
		if (import.meta.test) return;
		return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
	},
});

const tagIsPrivate = computed(() => labels.value?.find((label) => label.id === filterState.value.tag)?.private);

const isAuthorized = computed(() => {
	const currentTag = filterState.value.tag;
	if (currentTag === 'all' || !tagIsPrivate.value) return true;
	
	const { $claims } = useNuxtApp();
	const claims = $claims.value;
	const isReader = !!(claims.admin || claims.publisher || claims.owner || claims.reader);
	return isReader;
});

const {
	data: allNews,
	error,
	status,
} = await useFetch<Article[]>("/api/news", {
	key: cacheKey,
	method: "post",
	body: { 
		all: true,
		quantity: 1000
	},
	headers: computed(() => {
		return $token.value ? { Authorization: `Bearer ${$token.value}` } : {};
	}),
	getCachedData(key) {
		if (import.meta.test || (process as any).test || (process as any).env?.NODE_ENV === 'test') return;
		const cached = nuxtApp.payload.data[key] || nuxtApp.static.data[key];
		if (!cached) return;
		const fetchedAt = (nuxtApp.payload as any)._fetchedAt?.[key] || 0;
		if (Date.now() - fetchedAt > 1000 * 60 * 5) return;
		return cached;
	},
	onResponse({ response }) {
		if (response._data) {
			(nuxtApp.payload as any)._fetchedAt = (nuxtApp.payload as any)._fetchedAt || {};
			(nuxtApp.payload as any)._fetchedAt[cacheKey.value] = Date.now();
		}
	},
	lazy: true,
});

const filteredNews = computed(() => {
	if (!allNews.value) return [];
	
	let result = [...allNews.value];

	// Tag Filter
	if (filterState.value.tag !== 'all') {
		result = result.filter(article => 
			(article.tags || []).map(t => t.toLowerCase()).includes(filterState.value.tag.toLowerCase())
		);
	}

	// Search Filter
	if (filterState.value.search.trim()) {
		const query = filterState.value.search.toLowerCase().trim();
		result = result.filter(article => {
			return (article.title || "").toLowerCase().includes(query) ||
				   (article.intro || "").toLowerCase().includes(query) ||
				   (article.author || "").toLowerCase().includes(query) ||
				   (article.body || "").toLowerCase().includes(query);
		});
	}

	// Author Filter
	if (filterState.value.author !== 'all') {
		result = result.filter(article => 
			article.authorUid === filterState.value.author || article.author === filterState.value.author
		);
	}

	// Date Filter
	if (filterState.value.dateRange !== 'all') {
		const now = new Date();
		let startDate: Date;
		
		switch (filterState.value.dateRange) {
			case 'this-month':
				startDate = new Date(now.getFullYear(), now.getMonth(), 1);
				break;
			case 'last-6-months':
				startDate = new Date();
				startDate.setMonth(now.getMonth() - 6);
				break;
			case 'this-year':
				startDate = new Date(now.getFullYear(), 0, 1);
				break;
			default:
				startDate = new Date(0);
		}
		
		const startTime = startDate.getTime();
		result = result.filter(article => {
			if (!article.published) return false;
			return new Date(article.published).getTime() >= startTime;
		});
	}

	return result;
});
</script>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease-out;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(15px);
}
.list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
