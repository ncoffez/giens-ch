<script setup lang="ts">
import type { MarketItem } from "../../types";

const props = defineProps<{
	modelValue: MarketItem[];
}>();

const emit = defineEmits<{
	"update:modelValue": [value: MarketItem[]];
}>();

const dayOptions = [
	{ value: "mon", label: "Montag" },
	{ value: "tue", label: "Dienstag" },
	{ value: "wed", label: "Mittwoch" },
	{ value: "thu", label: "Donnerstag" },
	{ value: "fri", label: "Freitag" },
	{ value: "sat", label: "Samstag" },
	{ value: "sun", label: "Sonntag" },
];

const items = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

function addItem() {
	items.value = [
		...items.value,
		{
			dayKey: "mon",
			label: "",
			href: "",
			isHighlighted: false,
			compactLabel: false,
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
			:key="`${item.dayKey}-${index}`"
			class="space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/50"
		>
			<div class="flex items-center justify-between">
				<span class="text-sm font-bold text-stone-500">Markt {{ index + 1 }}</span>
				<div class="flex items-center gap-2">
					<UButton variant="ghost" size="xs" icon="i-lucide-chevron-up" :disabled="index === 0" @click="moveUp(index)" />
					<UButton variant="ghost" size="xs" icon="i-lucide-chevron-down" :disabled="index === items.length - 1" @click="moveDown(index)" />
					<UButton variant="ghost" size="xs" color="error" icon="i-lucide-trash-2" @click="removeItem(index)" />
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<UFormField label="Wochentag">
					<USelect v-model="item.dayKey" :items="dayOptions" />
				</UFormField>
				<UFormField label="Ort">
					<UInput v-model="item.label" placeholder="z.B. Giens" />
				</UFormField>
			</div>

			<UFormField label="Karten-Link">
				<UInput v-model="item.href" placeholder="https://..." />
			</UFormField>

			<div class="grid gap-4 md:grid-cols-2">
				<UFormField label="Hervorheben">
					<div class="flex min-h-10 items-center rounded-lg border border-stone-200 px-3 dark:border-stone-700">
						<USwitch v-model="item.isHighlighted" />
					</div>
				</UFormField>
				<UFormField label="Kompakte Beschriftung">
					<div class="flex min-h-10 items-center rounded-lg border border-stone-200 px-3 dark:border-stone-700">
						<USwitch v-model="item.compactLabel" />
					</div>
				</UFormField>
			</div>
		</div>

		<UButton variant="outline" icon="i-lucide-plus" @click="addItem">
			Markt hinzufügen
		</UButton>
	</div>
</template>
