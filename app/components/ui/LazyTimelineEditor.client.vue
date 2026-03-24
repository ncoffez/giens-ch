<script setup lang="ts">
import type { TimelineItem } from "../../../types";

const UiTimelineEditor = defineAsyncComponent(() => import("./TimelineEditor.vue"));

const model = defineModel<TimelineItem[]>({ required: true });
</script>

<template>
	<UiTimelineEditor v-model="model" />
</template>
