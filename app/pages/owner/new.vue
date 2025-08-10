<script lang="ts" setup>
const content = ref("");
</script>

<template>
	<nav class="flex max-w-screen-lg w-full mx-auto gap-2">
		<div class="w-full"></div>
		<UiButton class="primary">Veröffentlichen</UiButton>
		<UiButton class="subtle">Schliessen</UiButton>
	</nav>
	<TiptapEditor v-model="content" />
</template>

<style scoped></style>
