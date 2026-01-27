<template>
	<div id="news" class="flex flex-col max-w-screen-lg mx-auto px-4">
		<ClientOnly>
			<div v-if="isAuthorized" key="authorized-view">
				<div class="flex flex-col gap-4 mb-8 pt-4">
					<div class="flex justify-between items-center">
						<h1 class="text-3xl font-black tracking-tight">Aktuelles</h1>
						<UButton
							v-if="$isPublisher"
							to="/news/new"
							label="Neuer Artikel"
							icon="i-lucide-plus"
							color="primary"
							size="lg"
							class="rounded-full shadow-lg" />
					</div>
					
					<UiNewsFilter v-model="filterState" />
				</div>

				<div id="error" v-if="error" class="py-12">
					<h1 class="text-2xl font-bold">{{ error.statusCode }} - {{ error.name }}</h1>
					<p class="text-neutral-500">{{ error.message }}</p>
				</div>
				<div class="relative">
					<!-- Loading Overlay -->
					<div 
						v-if="status === 'pending' && news && news.length > 0" 
						class="absolute inset-0 bg-white/50 dark:bg-gray-950/50 z-10 flex justify-center pt-20 backdrop-blur-[2px] transition-all duration-500 rounded-3xl"
					>
						<div class="flex flex-col items-center gap-4">
							<UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
							<span class="text-sm font-bold text-primary uppercase tracking-widest">Aktualisiere...</span>
						</div>
					</div>

					<!-- Skeletons (only for initial load) -->
					<template v-if="status === 'pending' && (!news || news.length === 0)">
						<UiSummarySkeleton v-for="i in 5" :key="`skeleton-${i}`" :index="i" />
					</template>

					<!-- Content -->
					<template v-else-if="news && news.length > 0">
						<TransitionGroup 
							name="list" 
							tag="div" 
							class="space-y-4 md:space-y-0"
						>
							<UiSummary
								v-for="(article, index) of news"
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
					<div class="prose py-20 text-center mx-auto" v-else>
						<UIcon name="i-lucide-search-x" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
						<p class="text-xl font-bold text-gray-500">Keine Neuigkeiten zum gewählten Thema gefunden.</p>
						<UButton variant="link" @click="filterState = { search: '', tag: 'all', author: 'all', dateRange: 'all' }">Alle Filter zurücksetzen</UButton>
					</div>
				</div>
			</div>
			<div v-else class="py-12" key="not-authorized-view">
				<NotAuthorized :tag="tag" />
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
const tag = route.params.tag as string;
const nuxtApp = useNuxtApp();
const { $token, $isPublisher } = nuxtApp;

const filterState = ref({
	search: '',
	tag: tag || 'all',
	author: 'all',
	dateRange: 'all'
});

const debouncedSearch = ref('');
let debounceTimeout: any = null;

watch(() => filterState.value.search, (newVal) => {
	if (debounceTimeout) clearTimeout(debounceTimeout);
	debounceTimeout = setTimeout(() => {
		debouncedSearch.value = newVal;
	}, 300);
});

// Update URL when tag changes in filter
watch(() => filterState.value.tag, (newTag) => {
	if (import.meta.test) return;
	const currentTag = route.params.tag || 'all';
	if (newTag === currentTag) return;

	// Use replace to avoid filling history with every filter change
	if (newTag === 'all') {
		navigateTo('/news', { replace: true });
	} else {
		navigateTo(`/news/${newTag}`, { replace: true });
	}
});

// Sync filter with URL tag (only if different to avoid loops)
watch(() => route.params.tag, (newTag) => {
	const normalizedTag = (newTag as string) || 'all';
	if (filterState.value.tag !== normalizedTag) {
		filterState.value.tag = normalizedTag;
	}
});

// Create a unique key based on filters and auth status
const cacheKey = computed(() => {
	const authStatus = $token.value ? "auth" : "pub";
	const filterPart = `${debouncedSearch.value}-${filterState.value.tag}-${filterState.value.author}-${filterState.value.dateRange}`;
	return `news-list-${filterPart}-${authStatus}`;
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
	data: news,
	error,
	status,
	refresh
} = await useFetch<Article[]>("/api/news", {
	key: cacheKey,
	method: "post",
	body: computed(() => ({ 
		quantity: 20, 
		tag: filterState.value.tag,
		search: debouncedSearch.value,
		author: filterState.value.author,
		dateRange: filterState.value.dateRange
	})),
	headers: computed(() => {
		return $token.value ? { Authorization: `Bearer ${$token.value}` } : {};
	}),
	getCachedData(key) {
		// Disable caching in tests to avoid isolation issues
		if (import.meta.test || (process as any).test || (process as any).env?.NODE_ENV === 'test') return;
		
		const cached = nuxtApp.payload.data[key] || nuxtApp.static.data[key];
		if (!cached) return;

		// 5-minute expiry check
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
	watch: [cacheKey]
});
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
