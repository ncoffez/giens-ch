<template>
	<div id="documents" class="flex flex-col max-w-screen-lg mx-auto">
		<UiSummary
			v-for="(article, index) of news"
			:title="article.title"
			:link="`/owner/news/${article.id}`"
			:id="article.id"
			:subtitle="article.intro"
			:image-url="article.image"
			:labels="article.tags"
			:index="index"
			:date="new Date(article.published).toLocaleDateString('de-CH')" />
	</div>
</template>
<script lang="ts" setup>
const { data: news } = await useFetch("/api/news", {
	method: "post",
	body: { quantity: 10, label: "private", tag: "Dokumente" },
});
</script>
<style scoped></style>
