<template>
	<div id="news" class="flex flex-col max-w-screen-lg mx-auto">
		<ClientOnly>
			<UiSummary
				v-for="(article, index) of news"
				:link="`/article/${article.id}`"
				:id="article.id"
				:title="article.title"
				:subtitle="article.intro"
				:image-url="article.image"
				:labels="article.tags"
				:index="index"
				:date="new Date(article.published).toLocaleDateString('de-CH')" />
		</ClientOnly>
	</div>
</template>

<script lang="ts" setup>
const route = useRoute();
const tag = route.params.tag;
const { $currentUser } = useNuxtApp();
const label = $currentUser.value ? "private" : "public";

const { data: news } = await useFetch<NewsArticle[]>("/api/news", {
	method: "post",
	body: { quantity: 15, label, tag },
});
</script>

<style scoped></style>
