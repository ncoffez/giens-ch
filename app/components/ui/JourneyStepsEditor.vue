<script setup lang="ts">
import type { JourneyStep } from "../../types";

const props = withDefaults(defineProps<{
	modelValue: JourneyStep[];
	eyebrowLabel?: string;
	titleLabel?: string;
	detailLabel?: string;
	addLabel?: string;
	titlePlaceholder?: string;
	detailPlaceholder?: string;
	eyebrowPlaceholder?: string;
}>(), {
	eyebrowLabel: "Vorspann",
	titleLabel: "Titel",
	detailLabel: "Detail",
	addLabel: "Eintrag hinzufügen",
	titlePlaceholder: "",
	detailPlaceholder: "",
	eyebrowPlaceholder: "",
});

const emit = defineEmits<{
	"update:modelValue": [value: JourneyStep[]];
}>();

const textareaUi = {
	root: "w-full",
	base: "w-full min-h-32 resize-y rounded-2xl px-4 py-3 leading-relaxed",
};

const items = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

function addItem() {
	items.value = [
		...items.value,
		{
			eyebrow: "",
			title: "",
			detail: "",
		},
	];
}

function removeItem(index: number) {
	items.value = items.value.filter((_, itemIndex) => itemIndex !== index);
}

function moveUp(index: number) {
	if (index === 0) return;
	const nextItems = [...items.value];
	[nextItems[index - 1], nextItems[index]] = [nextItems[index], nextItems[index - 1]];
	items.value = nextItems;
}

function moveDown(index: number) {
	if (index >= items.value.length - 1) return;
	const nextItems = [...items.value];
	[nextItems[index], nextItems[index + 1]] = [nextItems[index + 1], nextItems[index]];
	items.value = nextItems;
}
</script>

<template>
	<div class="space-y-6">
		<div
			v-for="(item, index) in items"
			:key="index"
			class="space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/50"
		>
			<div class="flex items-center justify-between">
				<span class="text-sm font-bold text-stone-500">Eintrag {{ index + 1 }}</span>
				<div class="flex items-center gap-2">
					<UButton variant="ghost" size="xs" icon="i-lucide-chevron-up" :disabled="index === 0" @click="moveUp(index)" />
					<UButton variant="ghost" size="xs" icon="i-lucide-chevron-down" :disabled="index === items.length - 1" @click="moveDown(index)" />
					<UButton variant="ghost" size="xs" color="error" icon="i-lucide-trash-2" @click="removeItem(index)" />
				</div>
			</div>

			<UFormField :label="eyebrowLabel">
				<UInput v-model="item.eyebrow" :placeholder="eyebrowPlaceholder" />
			</UFormField>

			<UFormField :label="titleLabel">
				<UInput v-model="item.title" :placeholder="titlePlaceholder" />
			</UFormField>

			<UFormField :label="detailLabel">
				<UTextarea
					v-model="item.detail"
					:rows="4"
					:ui="textareaUi"
					:placeholder="detailPlaceholder"
				/>
			</UFormField>
		</div>

		<UButton variant="outline" icon="i-lucide-plus" @click="addItem">
			{{ addLabel }}
		</UButton>
	</div>
</template>
