<script lang="ts" setup>
defineProps<{
	title: string;
	to: string;
	icon: string;
}>();
</script>

<template>
	<NuxtLink
		:to="to"
		class="flex flex-row md:flex-col items-center justify-start md:justify-center p-4 md:p-6 rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group border-b-2 md:border-b-4 border-b-transparent hover:border-b-primary gap-4 md:gap-0">
		<div
			class="p-3 md:p-4 rounded-xl md:rounded-2xl bg-neutral-50 dark:bg-neutral-900 text-primary md:mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
			<UIcon :name="icon" class="w-8 h-8 md:w-10 md:h-10" />
		</div>
		<h3 class="text-base md:text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
			{{ title }}
		</h3>
		<UIcon name="i-lucide-chevron-right" class="md:hidden ml-auto text-stone-400" />
	</NuxtLink>
</template>
