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
</script>

<template>
	<div class="space-y-4">
		<div v-if="loading">Loading...</div>

		<div v-else-if="articles.length === 0" class="text-center py-4 text-gray-500 text-sm">
			No articles published yet.
		</div>

		<div v-else class="space-y-3">
			<NuxtLink
				v-for="article in articles"
				:key="article.id"
				:to="`/article/${article.id}`"
				class="flex items-start gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
			>
				<img
					:src="article.image"
					:alt="article.title"
					class="w-16 h-16 object-cover rounded-lg flex-shrink-0"
					loading="lazy"
				/>
				<div class="flex-1 min-w-0">
					<h3 class="font-semibold text-sm truncate">{{ article.title }}</h3>
					<p class="text-xs text-gray-500 mt-1">
						{{ new Date(article.published).toLocaleDateString("de-CH", { day: "2-digit", month: "short", year: "numeric" }) }}
					</p>
				</div>
				<UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
			</NuxtLink>
		</div>
	</div>
</template>