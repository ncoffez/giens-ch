<script setup lang="ts">
import type { TimelineItem } from "../../types";

const props = defineProps<{
	modelValue: TimelineItem[];
}>();

const emit = defineEmits<{
	"update:modelValue": [value: TimelineItem[]];
}>();

const iconOptions = [
	{ value: "i-lucide-home", label: "Home" },
	{ value: "i-lucide-circle-dollar-sign", label: "Dollar" },
	{ value: "i-lucide-users", label: "Users" },
	{ value: "i-lucide-heart-handshake", label: "Handshake" },
	{ value: "i-lucide-calendar", label: "Calendar" },
	{ value: "i-lucide-star", label: "Star" },
	{ value: "i-lucide-flag", label: "Flag" },
	{ value: "i-lucide-rocket", label: "Rocket" },
];

const items = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
});

function addItem() {
	items.value = [
		...items.value,
		{
			date: "",
			title: "",
			description: "",
			icon: "i-lucide-star",
		},
	];
}

function removeItem(index: number) {
	items.value = items.value.filter((_, i) => i !== index);
}

function moveUp(index: number) {
	if (index === 0) return;
	const newItems = [...items.value];
	[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
	items.value = newItems;
}

function moveDown(index: number) {
	if (index === items.value.length - 1) return;
	const newItems = [...items.value];
	[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
	items.value = newItems;
}
</script>

<template>
	<div class="space-y-6">
		<div
			v-for="(item, index) in items"
			:key="index"
			class="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 space-y-4"
		>
			<div class="flex items-center justify-between">
				<span class="text-sm font-bold text-stone-500">Eintrag {{ index + 1 }}</span>
				<div class="flex items-center gap-2">
					<UButton
						variant="ghost"
						size="xs"
						icon="i-lucide-chevron-up"
						:disabled="index === 0"
						@click="moveUp(index)"
					/>
					<UButton
						variant="ghost"
						size="xs"
						icon="i-lucide-chevron-down"
						:disabled="index === items.length - 1"
						@click="moveDown(index)"
					/>
					<UButton
						variant="ghost"
						size="xs"
						color="error"
						icon="i-lucide-trash-2"
						@click="removeItem(index)"
					/>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<UFormField label="Datum">
					<UInput v-model="item.date" placeholder="z.B. 1979/1980" />
				</UFormField>
				<UFormField label="Icon">
					<USelect v-model="item.icon" :items="iconOptions" />
				</UFormField>
			</div>

			<UFormField label="Titel">
				<UInput v-model="item.title" placeholder="Titel des Eintrags" />
			</UFormField>

			<UFormField label="Beschreibung">
				<UTextarea v-model="item.description" :rows="3" placeholder="Beschreibung des Eintrags" />
			</UFormField>
		</div>

		<UButton
			variant="outline"
			icon="i-lucide-plus"
			@click="addItem"
		>
			Eintrag hinzufügen
		</UButton>
	</div>
</template>
