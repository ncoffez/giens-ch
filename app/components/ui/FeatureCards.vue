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
	<div class="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
		<div
			v-for="card in cards"
			:key="card.title"
			class="space-y-5 border-l border-[var(--app-border)] pl-5 md:pl-6"
		>
			<div class="flex items-center gap-4">
				<div :class="[getColorClasses(card.bgColor).bg, getColorClasses(card.iconColor).text, 'flex h-12 w-12 items-center justify-center rounded-full']">
					<UIcon :name="card.icon" class="w-6 h-6" />
				</div>
				<span class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">
					{{ card.title }}
				</span>
			</div>
			<h3 class="display-copy text-2xl leading-tight tracking-[-0.03em] text-[var(--app-text)]">{{ card.title }}</h3>
			<p class="max-w-sm text-sm leading-relaxed text-[var(--app-muted)]">{{ card.description }}</p>
		</div>
	</div>
</template>
