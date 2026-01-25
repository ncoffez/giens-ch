<script lang="ts" setup>
definePageMeta({
	middleware: ["is-publisher"],
});

const content = ref("");
</script>

<template>
	<nav class="flex max-w-screen-lg w-full mx-auto gap-2 my-4 place-content-end">
		<UButton color="primary">Veröffentlichen</UButton>
		<UButton color="neutral" variant="ghost" @click="navigateTo('/news')">Schliessen</UButton>
	</nav>
	<TiptapEditor v-model="content" />
</template>

<style scoped></style>
