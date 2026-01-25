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
		class="flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group border-b-4 border-b-transparent hover:border-b-primary">
		<div
			class="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
			<UIcon :name="icon" class="w-10 h-10" />
		</div>
		<h3 class="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
			{{ title }}
		</h3>
	</NuxtLink>
</template>
