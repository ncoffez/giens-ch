<script setup lang="ts">
import type { MarketItem } from "../../../types";

const UiMarketItemsEditor = defineAsyncComponent(() => import("./MarketItemsEditor.vue"));

const model = defineModel<MarketItem[]>({ required: true });
</script>

<template>
	<UiMarketItemsEditor v-model="model" />
</template>
