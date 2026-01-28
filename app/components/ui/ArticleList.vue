<script setup lang="ts">
interface Article {
	id: string;
	title: string;
	published: string;
	image: string;
	tags?: string[];
}

interface Props {
	articles: Article[];
	loading?: boolean;
}

defineProps<Props>();
const placeholders = [
	"/giens/strand-1.webp",
	"/giens/meer-1.webp",
	"/giens/pizza.webp",
	"/giens/giens-aerial.webp",
	"/giens/garten.jpeg",
	"/giens/felsen.webp"
];

const getPlaceholder = (id: string) => {
	// Simple deterministic hash based on string
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash);
	}
	const index = Math.abs(hash) % placeholders.length;
	return placeholders[index];
};
</script>

<template>
	<div class="space-y-4">
		<div v-if="loading">Lädt...</div>

		<div v-else-if="articles.length === 0" class="text-center py-4 text-gray-500 text-sm">
			Noch keine Artikel veröffentlicht.
		</div>

		<div v-else class="space-y-3">
			<NuxtLink
				v-for="article in articles"
				:key="article.id"
				:to="`/article/${article.id}`"
				class="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all hover:shadow-md group"
			>
				<img
					:src="article.image || getPlaceholder(article.id)"
					:alt="article.title"
					class="w-20 h-20 object-cover rounded-xl flex-shrink-0 shadow-sm"
					loading="lazy"
				/>
				<div class="flex-1 min-w-0">
					<h3 class="font-black text-xl tracking-tight truncate group-hover:text-primary transition-colors">{{ article.title }}</h3>
					<p class="text-md text-gray-500 mt-1 font-medium">
						{{ new Date(article.published).toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" }) }}
					</p>
				</div>
				<UIcon name="i-lucide-chevron-right" class="w-6 h-6 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
			</NuxtLink>
		</div>
	</div>
</template>