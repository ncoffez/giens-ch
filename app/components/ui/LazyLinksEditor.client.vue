<script setup lang="ts">
import type { LinkItem } from "../../../types";

const UiLinksEditor = defineAsyncComponent(() => import("./LinksEditor.vue"));

const model = defineModel<LinkItem[]>({ required: true });
</script>

<template>
	<UiLinksEditor v-model="model" />
</template>
