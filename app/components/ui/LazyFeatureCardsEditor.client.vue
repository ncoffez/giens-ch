<script setup lang="ts">
import type { FeatureCard } from "../../../types";

const UiFeatureCardsEditor = defineAsyncComponent(() => import("./FeatureCardsEditor.vue"));

const model = defineModel<FeatureCard[]>({ required: true });
</script>

<template>
	<UiFeatureCardsEditor v-model="model" />
</template>
