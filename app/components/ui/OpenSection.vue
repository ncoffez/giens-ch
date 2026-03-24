<template>
	<section class="space-y-8 border-t border-[var(--app-border)] pt-12 md:pt-16">
		<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
			<div class="max-w-4xl">
				<UiTitle :subtitle="subtitle" :title="title" />
			</div>
			<div v-if="$slots.actions" class="flex items-center justify-end gap-2">
				<slot name="actions" />
			</div>
		</div>

		<div>
			<slot />
		</div>
	</section>
</template>

<script setup lang="ts">
defineProps<{
	title: string;
	subtitle: string;
}>();
</script>
