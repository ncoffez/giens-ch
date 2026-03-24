<script setup lang="ts">
const TiptapEditor = defineAsyncComponent(() => import("./editor.vue"));

const model = defineModel<string>({ default: "" });
</script>

<template>
	<TiptapEditor v-model="model" />
</template>
