<script setup lang="ts">
import type { FeatureCard } from "../../types";

const props = defineProps<{
	modelValue: FeatureCard[];
}>();

const emit = defineEmits<{
	"update:modelValue": [value: FeatureCard[]];
}>();

const iconOptions = [
	{ value: "i-lucide-home", label: "Home" },
	{ value: "i-lucide-sun", label: "Sun" },
	{ value: "i-lucide-heart-handshake", label: "Handshake" },
	{ value: "i-lucide-trees", label: "Trees" },
	{ value: "i-lucide-car", label: "Car" },
	{ value: "i-lucide-wifi", label: "WiFi" },
	{ value: "i-lucide-utensils", label: "Utensils" },
	{ value: "i-lucide-bike", label: "Bike" },
	{ value: "i-lucide-waves", label: "Waves" },
	{ value: "i-lucide-mountain", label: "Mountain" },
];

const colorOptions = [
	{ value: "blue", label: "Blau" },
	{ value: "amber", label: "Bernstein" },
	{ value: "rose", label: "Rose" },
	{ value: "emerald", label: "Smaragd" },
	{ value: "purple", label: "Lila" },
	{ value: "cyan", label: "Cyan" },
];

const items = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
});

function addItem() {
	items.value = [
		...items.value,
		{
			icon: "i-lucide-star",
			title: "",
			description: "",
			bgColor: "blue",
			iconColor: "blue",
		},
	];
}

function removeItem(index: number) {
	items.value = items.value.filter((_, i) => i !== index);
}

function getColorClasses(color: string) {
	const colors: Record<string, { bg: string; text: string }> = {
		blue: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
		amber: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400" },
		rose: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-400" },
		emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
		purple: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
		cyan: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-600 dark:text-cyan-400" },
	};
	return colors[color] || colors.blue;
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
				<span class="text-sm font-bold text-stone-500">Karte {{ index + 1 }}</span>
				<UButton
					variant="ghost"
					size="xs"
					color="error"
					icon="i-lucide-trash-2"
					@click="removeItem(index)"
				/>
			</div>

			<div class="grid grid-cols-3 gap-4">
				<UFormField label="Icon">
					<USelect v-model="item.icon" :items="iconOptions" />
				</UFormField>
				<UFormField label="Hintergrund">
					<USelect v-model="item.bgColor" :items="colorOptions" />
				</UFormField>
				<UFormField label="Icon-Farbe">
					<USelect v-model="item.iconColor" :items="colorOptions" />
				</UFormField>
			</div>

			<UFormField label="Titel">
				<UInput v-model="item.title" placeholder="Titel der Karte" />
			</UFormField>

			<UFormField label="Beschreibung">
				<UTextarea v-model="item.description" :rows="3" placeholder="Beschreibung" />
			</UFormField>

			<div class="flex items-center gap-3 p-3 rounded-lg bg-stone-100 dark:bg-stone-700">
				<div :class="[getColorClasses(item.bgColor).bg, getColorClasses(item.iconColor).text, 'p-3 rounded-2xl']">
					<UIcon :name="item.icon" class="w-6 h-6" />
				</div>
				<span class="text-sm text-stone-500">Vorschau</span>
			</div>
		</div>

		<UButton
			variant="outline"
			icon="i-lucide-plus"
			@click="addItem"
		>
			Karte hinzufügen
		</UButton>
	</div>
</template>
