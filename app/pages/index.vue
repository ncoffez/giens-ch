<template>
	<div class="gap-16 flex-col flex">
		<div id="hero-image" class="rounded-xl w-full mx-auto overflow-clip">
			<img
				class="object-cover max-h-[60vh] h-full w-full brightness-110 contrast-[90%]"
				src="/giens/hauseingang_cropped.jpg"
				alt="Einfahrt zum Lotissement Beausoleil in Giens"
				srcset="" />
		</div>
		<UiTitle
      class="max-w-screen-lg mx-auto"
			subtitle="Das Lotissement Beausoleil im Herzen von Giens"
			title="Die familiäre Siedlung seit über 30 Jahren" />
		<UiSlides class="mb-8" />
		<div id="news" class="flex flex-col">
			<LazyUiSummary
				v-for="(article, index) of news"
				:link="`/news/${article.id}`"
				:id="article.id"
				:title="article.title"
				:subtitle="article.intro"
				:image-url="article.image"
				:labels="article.tags"
				:index="index"
				:date="new Date(article.published).toLocaleDateString('de-CH')" />
		</div>
	</div>
</template>
<script lang="ts" setup>
import type { NewsArticle } from "~~/server/api/news";
const { $currentUser } = useNuxtApp();
const label = $currentUser.value ? "private" : "public";

const { data: news } = await useLazyFetch<NewsArticle[]>("/api/news", {
	method: "post",
	body: { quantity: 3, label },
});
</script>
<style scoped></style>
