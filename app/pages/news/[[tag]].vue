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
				<template v-if="status === 'pending'">
					<UiSummarySkeleton v-for="i in 5" :key="`skeleton-${i}`" :index="i" />
				</template>
				<template v-else-if="news && news.length > 0">
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
						:index="index"
						:date="new Date(article.published).toLocaleDateString('de-CH')" />
				</template>
				<div class="prose py-12 text-center" v-else>
					<p>Keine Neuigkeiten zum gewählten Thema gefunden.</p>
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

// Update URL when tag changes in filter
watch(() => filterState.value.tag, (newTag) => {
	const currentTag = route.params.tag || 'all';
	if (newTag === currentTag) return;

	if (newTag === 'all') {
		navigateTo('/news');
	} else {
		navigateTo(`/news/${newTag}`);
	}
});

// Sync filter with URL tag
watch(() => route.params.tag, (newTag) => {
	const normalizedTag = (newTag as string) || 'all';
	if (filterState.value.tag !== normalizedTag) {
		filterState.value.tag = normalizedTag;
	}
});

// Create a unique key based on filters and auth status
const cacheKey = computed(() => {
	const authStatus = $token.value ? "auth" : "pub";
	const testId = import.meta.test ? Math.random().toString() : "";
	const filterPart = `${filterState.value.search}-${filterState.value.tag}-${filterState.value.author}-${filterState.value.dateRange}`;
	return `news-list-${filterPart}-${authStatus}${testId}`;
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
} = await useFetch<Article[]>("/api/news", {
	key: cacheKey.value,
	method: "post",
	body: computed(() => ({ 
		quantity: 20, 
		tag: filterState.value.tag,
		search: filterState.value.search,
		author: filterState.value.author,
		dateRange: filterState.value.dateRange
	})),
	headers: computed(() => {
		return $token.value ? { Authorization: `Bearer ${$token.value}` } : {};
	}),
	getCachedData(key) {
		if (import.meta.test) return;
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
});
</script>

<style scoped></style>
