<template>
	<div id="news" class="flex flex-col max-w-screen-lg mx-auto">
		<ClientOnly>
			<div v-if="isAuthorized">
				<div id="error" v-if="error">
					<h1>{{ error.statusCode }} - {{ error.name }}</h1>
					<p>{{ error.message }}</p>
				</div>
				<UiSummary
					v-if="news && news.length > 0"
					v-for="(article, index) of news"
					:link="`/article/${article.id}`"
					:id="article.id"
					:title="article.title"
					:subtitle="article.intro"
					:image-url="article.image"
					:labels="article.tags"
					:index="index"
					:date="new Date(article.published).toLocaleDateString('de-CH')" />
				<div class="prose" v-else>
					<p>No news found matching the tag.</p>
				</div>
			</div>
			<div v-else>
				<NotAuthorized :tag="tag" />
			</div>
		</ClientOnly>
	</div>
</template>

<script lang="ts" setup>
import type { Article } from "~/utils/article";

const route = useRoute();
const tag = route.params.tag;
const { $userPermission } = useNuxtApp();
const labels = await $fetch("/api/labels");
const tagIsPrivate = computed(() => labels.find((label) => label.id === tag)?.private);
const isAuthorized = computed(() => {
	if (!tag || !tagIsPrivate.value) return true;
	if (tagIsPrivate.value && $userPermission.value === "private") return true;
	return false;
});

const { data: news, error } = await useFetch<Article[]>("/api/news", {
	method: "post",
	body: { quantity: 15, permission: $userPermission.value, tag },
});
</script>

<style scoped></style>
