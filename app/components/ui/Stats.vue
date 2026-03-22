<script setup lang="ts">
import type { StatItem } from "../../types";

defineProps<{
	stats: StatItem[];
}>();
</script>

<template>
	<div class="flex items-center justify-center gap-4 md:gap-8 text-center py-8">
		<template v-for="(stat, index) in stats" :key="index">
			<div class="flex flex-col items-center">
				<span class="text-4xl md:text-5xl font-black text-primary tracking-tighter">{{ stat.value }}</span>
				<span class="text-[10px] md:text-xs uppercase tracking-widest font-black text-stone-600 dark:text-stone-400">{{ stat.label }}</span>
			</div>
			<div v-if="index < stats.length - 1" class="w-8 md:w-12 h-px bg-gray-200 dark:bg-stone-800"></div>
		</template>
	</div>
</template>
