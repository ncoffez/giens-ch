<template>
	<div v-if="error">
		<p>Error loading article: {{ error?.data?.message ?? error?.message ?? "Unknown error" }}</p>
	</div>
	<div v-else-if="!article">
		<p>Loading...</p>
	</div>
	<article v-else class="prose max-w-2xl mx-auto px-4">
		<h1>{{ article.title }}</h1>
		<div v-html="article.body"></div>
	</article>
</template>
<script lang="ts" setup>
const route = useRoute();
const id = route.params.id;
const { $currentUser } = useNuxtApp();
const label = $currentUser.value ? "private" : "public";

const { data: article, error } = await useLazyFetch<NewsArticle>(`/api/getArticle`, {
	method: "post",
	body: { id, label },
});
</script>
<style scoped></style>
