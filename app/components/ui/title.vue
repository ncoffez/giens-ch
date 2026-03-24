<template>
	<div class="flex flex-col items-start gap-3 mb-8 md:mb-12">
		<h3
			id="subtitle"
			class="text-xs md:text-sm font-extrabold uppercase tracking-[0.28em] text-[var(--app-primary)]/90 mb-0"
		>
			{{ subtitle }}
		</h3>
		<h2
			class="skip-ink display-copy text-3xl md:text-6xl font-bold leading-[1.02] tracking-[-0.04em] text-balance text-[var(--app-text)]">
			{{ title }}
		</h2>
		<div class="h-1.5 w-16 rounded-full bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-accent)]" />
	</div>
</template>
<script lang="ts" setup>
defineProps(["title", "subtitle"]);
</script>
<style scoped></style>
