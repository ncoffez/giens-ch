<template>
	<div id="news" class="flex flex-col max-w-screen-lg mx-auto">
		<UiSummary
			v-for="(article, index) of news"
			:link="`/owner/news/${article.id}`"
			:id="article.id"
			:title="article.title"
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
	body: { quantity: 15 },
	headers: computed(() => {
		return $token.value ? { Authorization: `Bearer ${$token.value}` } : {};
	}),
});
</script>
<style scoped></style>
