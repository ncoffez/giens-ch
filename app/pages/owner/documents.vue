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
const { $token } = useNuxtApp();
const { data: news } = await useFetch<any[]>("/api/news", {
	method: "post",
	body: { quantity: 10, tag: "Dokumente" },
	headers: computed(() => {
		return $token.value ? { Authorization: `Bearer ${$token.value}` } : {};
	}),
});
</script>
<style scoped></style>
