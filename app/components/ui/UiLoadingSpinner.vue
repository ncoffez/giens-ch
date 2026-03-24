<script setup lang="ts">
interface Props {
	size?: "sm" | "md" | "lg";
	label?: string;
}

withDefaults(defineProps<Props>(), {
	size: "md",
	label: "",
});

const sizeClasses = {
	sm: "w-5 h-5 border-2",
	md: "w-8 h-8 border-4",
	lg: "w-12 h-12 border-4",
};
</script>

<template>
	<div class="flex items-center gap-3">
		<div
			class="border-primary border-t-transparent rounded-full animate-spin"
			:class="sizeClasses[size]"
		/>
		<span v-if="label" class="text-sm text-stone-500 dark:text-stone-400">
			{{ label }}
		</span>
	</div>
</template>
