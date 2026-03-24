<script setup lang="ts">
interface Props {
	icon?: string;
	title: string;
	description?: string;
}

withDefaults(defineProps<Props>(), {
	icon: "i-lucide-inbox",
	description: "",
});
</script>

<template>
	<div class="flex flex-col items-center justify-center py-12 px-4 text-center">
		<div class="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
			<UIcon :name="icon" class="w-8 h-8 text-stone-400 dark:text-stone-500" />
		</div>
		<h3 class="text-lg font-semibold text-stone-700 dark:text-stone-300">
			{{ title }}
		</h3>
		<p v-if="description" class="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-sm">
			{{ description }}
		</p>
		<div v-if="$slots.action" class="mt-4">
			<slot name="action" />
		</div>
	</div>
</template>
