<script setup lang="ts">
const nuxtApp = useNuxtApp();
const { $isReader } = nuxtApp;
const { data: labels } = await useFetch<any[]>("/api/labels", {
	key: "labels-list",
	getCachedData(key) {
		if (import.meta.test) return;
		return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
	},
});

const availableTags = computed(() => {
	if (!labels.value) return [];
	
	const items = labels.value
		.filter(l => !l.private || $isReader.value)
		.map(l => ({
			id: l.id,
			label: l.title || l.id.charAt(0).toUpperCase() + l.id.slice(1),
			to: `/news/${l.id}`
		}));

	// Add "Siedlung" as a special category if it doesn't exist as a tag
	if (!items.find(i => i.id === "siedlung")) {
		items.push({
			id: "siedlung",
			label: "Siedlung",
			to: "/news/siedlung"
		});
	}

	return [
		{ id: "all", label: "Alle", to: "/news" },
		...items
	];
});

const route = useRoute();
const activeTag = computed(() => route.params.tag || "all");
</script>

<template>
	<div class="flex flex-wrap gap-2 mb-8 items-center justify-center">
		<NuxtLink
			v-for="tag in availableTags"
			:key="tag.id"
			:to="tag.to"
			class="px-4 py-1.5 rounded-full text-sm font-bold transition-all border shrink-0"
			:class="[
				activeTag === tag.id 
					? 'bg-primary text-white border-primary shadow-md scale-105' 
					: 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-primary/50'
			]"
		>
			{{ tag.label }}
		</NuxtLink>
	</div>
</template>
