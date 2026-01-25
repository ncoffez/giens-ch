<template>
	<div v-if="error" class="max-w-screen-xl mx-auto px-4 py-20">
		<p class="text-error">Error loading article: {{ error?.data?.message ?? error?.message ?? "Unknown error" }}</p>
	</div>
	<div v-else-if="status === 'pending'">
		<UiArticleSkeleton />
	</div>
	<div v-else-if="article" class="w-full space-y-12 mb-24">
		<!-- Hero Section -->
		<section class="relative w-full h-[50vh] md:h-[60vh] overflow-hidden rounded-[2.5rem] shadow-2xl">
			<img
				v-if="article.image"
				:src="article.image"
				class="object-cover h-full w-full brightness-105 contrast-[95%] scale-105"
				:alt="article.title" />
			<div v-else class="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
				<UIcon name="i-lucide-image" class="w-20 h-20 text-neutral-300" />
			</div>
		</section>

		<div class="max-w-screen-lg mx-auto px-4 w-full">
			<!-- Header -->
			<div class="mb-12">
				<UiTitle
					:subtitle="new Date(article.published).toLocaleDateString('de-CH')"
					:title="article.title" />
				<div class="flex flex-wrap gap-2 -mt-4">
					<UBadge
						v-for="tag in article.tags"
						:key="tag"
						color="primary"
						variant="subtle"
						class="rounded-full px-3 py-1">
						{{ tag }}
					</UBadge>
				</div>
			</div>

			<!-- Content -->
			<article class="prose max-w-none mx-auto lg:text-lg leading-relaxed">
				<div v-html="article.body"></div>
			</article>
		</div>
	</div>
</template>
<script lang="ts" setup>
import type { NewsArticle } from "~/composables/newsArticle";

const route = useRoute();
const id = route.params.id;
const { $currentUser } = useNuxtApp();
const label = $currentUser.value ? "private" : "public";

const {
	data: article,
	error,
	status,
} = await useLazyFetch<NewsArticle>(`/api/getArticle`, {
	method: "post",
	body: { id, label },
});
</script>
<style scoped></style>
