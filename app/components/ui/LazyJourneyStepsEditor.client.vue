<script setup lang="ts">
import type { JourneyStep } from "../../../types";

const UiJourneyStepsEditor = defineAsyncComponent(() => import("./JourneyStepsEditor.vue"));

const model = defineModel<JourneyStep[]>({ required: true });
</script>

<template>
	<UiJourneyStepsEditor v-model="model" />
</template>
