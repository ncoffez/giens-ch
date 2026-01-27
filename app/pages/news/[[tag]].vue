<template>
	<div id="news" class="flex flex-col max-w-screen-lg mx-auto px-4">
		<ClientOnly>
			<div v-if="isAuthorized" key="authorized-view">
				<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-4">
					<UiTagFilter />
					<UButton
						v-if="$isPublisher"
						to="/news/new"
						label="Neuer Artikel"
						icon="i-lucide-plus"
						color="primary"
						size="lg"
						class="rounded-full shadow-lg self-end md:self-auto" />
				</div>

				<!-- Specialized Siedlung View -->
				<div v-if="tag === 'siedlung'" class="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
					<UiTravelCard to="/travel" title="Anreise" icon="i-lucide-car" />
					<UiTravelCard to="/about" title="Über uns" icon="i-lucide-info" />
				</div>

				<div id="error" v-else-if="error" class="py-12">
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

// Create a unique key based on tag and auth status
const cacheKey = computed(() => {
	const authStatus = $token.value ? "auth" : "pub";
	const testId = import.meta.test ? Math.random().toString() : "";
	return `news-list-${tag || "all"}-${authStatus}${testId}`;
});

// Fetch labels to determine if tag is private
const { data: labels } = await useFetch<any[]>("/api/labels", {
	key: "labels-list",
	getCachedData(key) {
		if (import.meta.test) return;
		return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
	},
});

const tagIsPrivate = computed(() => labels.value?.find((label) => label.id === tag)?.private);

const isAuthorized = computed(() => {
	if (!tag || !tagIsPrivate.value) return true;
	// We'll rely on the server to reject if not actually authorized, 
	// but this UI check is still useful for immediate feedback.
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
	key: (process.env.NODE_ENV === 'test' ? Math.random().toString() : cacheKey.value),
	method: "post",
	body: { quantity: 15, tag },
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
