<script setup lang="ts">
import type { StatItem } from "../../../types";

const UiStatsEditor = defineAsyncComponent(() => import("./StatsEditor.vue"));

const model = defineModel<StatItem[]>({ required: true });
</script>

<template>
	<UiStatsEditor v-model="model" />
</template>
