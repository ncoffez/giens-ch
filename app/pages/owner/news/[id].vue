<template>
	<div v-if="error">
	<p>Error loading article: {{ (error?.data?.message ?? error?.message ?? 'Unknown error') }}</p>
	</div>
	<div v-else-if="!article">
		<p>Loading...</p>
	</div>
	<article v-else class="max-w-2xl mx-auto px-4">
		<h1>{{ article.title }}</h1>
		<div v-html="article.body" class="prose"></div>
	</article>
</template>
<script lang="ts" setup>
const route = useRoute();
const id = route.params.id;

const { data: article, error } = await useLazyFetch(`/api/getArticle`, {
	method: "post",
	body: { id, label: "private" },
});
</script>

<style scoped></style>
