<script setup lang="ts">
import type { FeatureCard } from "../../types";

defineProps<{
	cards: FeatureCard[];
}>();

function getColorClasses(color: string) {
	const colors: Record<string, { bg: string; text: string }> = {
		blue: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
		amber: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400" },
		rose: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-400" },
		emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
		purple: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
		cyan: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-600 dark:text-cyan-400" },
	};
	return colors[color] || colors.blue;
}
</script>

<template>
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-8 md:mt-12">
		<div
			v-for="card in cards"
			:key="card.title"
			class="p-6 md:p-8 rounded-3xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm space-y-4"
		>
			<div :class="[getColorClasses(card.bgColor).bg, getColorClasses(card.iconColor).text, 'p-3 w-fit rounded-2xl']">
				<UIcon :name="card.icon" class="w-8 h-8" />
			</div>
			<h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ card.title }}</h3>
			<p class="text-stone-500 text-sm leading-relaxed">{{ card.description }}</p>
		</div>
	</div>
</template>
