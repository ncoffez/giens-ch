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

const cardCountLabel = computed(() => {
	if (items.value.length === 1) {
		return "1 Karte";
	}

	return `${items.value.length} Karten`;
});

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

function getPreviewTitle(item: FeatureCard) {
	return item.title.trim() || "Titel der Karte";
}

function getPreviewDescription(item: FeatureCard) {
	return item.description.trim() || "Hier erscheint die Beschreibung Ihrer Karte, sobald Sie Text eingeben.";
}
</script>

<template>
	<div class="space-y-6">
		<div class="rounded-[1.75rem] border border-stone-200/80 bg-gradient-to-br from-white via-stone-50 to-stone-100/80 p-5 shadow-sm dark:border-stone-800 dark:from-stone-950 dark:via-stone-900 dark:to-stone-900/80"
		>
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div class="space-y-1">
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)]">
						Karteneditor
					</p>
					<div class="flex items-center gap-3">
						<h3 class="text-lg font-semibold text-stone-900 dark:text-white">
							Inhalte und Vorschau auf einen Blick
						</h3>
						<UBadge color="neutral" variant="subtle" class="rounded-full">
							{{ cardCountLabel }}
						</UBadge>
					</div>
					<p class="max-w-2xl text-sm leading-relaxed text-stone-500 dark:text-stone-400">
						Pflegen Sie Titel, Beschreibung und Farben direkt in den Karten. Die Live-Vorschau hilft, das Ergebnis sofort einzuschätzen.
					</p>
				</div>
				<UButton
					variant="soft"
					icon="i-lucide-plus"
					class="self-start rounded-full"
					@click="addItem"
				>
					Karte hinzufügen
				</UButton>
			</div>
		</div>

		<div
			v-if="!items.length"
			class="rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50/70 px-6 py-10 text-center dark:border-stone-700 dark:bg-stone-900/40"
		>
			<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-stone-800">
				<UIcon name="i-lucide-layout-grid" class="h-6 w-6 text-[var(--app-primary)]" />
			</div>
			<h4 class="text-base font-semibold text-stone-900 dark:text-white">
				Noch keine Karten angelegt
			</h4>
			<p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500 dark:text-stone-400">
				Legen Sie die erste Karte an, um einen neuen Eintrag mit Icon, Farben und Beschreibung vorzubereiten.
			</p>
		</div>

		<div
			v-for="(item, index) in items"
			:key="index"
			class="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-950"
		>
			<div class="flex flex-col gap-4 border-b border-stone-200/80 bg-stone-50/80 px-5 py-4 dark:border-stone-800 dark:bg-stone-900/70 md:flex-row md:items-center md:justify-between">
				<div class="space-y-1">
					<p class="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400 dark:text-stone-500">
						Karte {{ index + 1 }}
					</p>
					<h4 class="text-base font-semibold text-stone-900 dark:text-white">
						{{ getPreviewTitle(item) }}
					</h4>
				</div>
				<UButton
					variant="ghost"
					size="sm"
					color="error"
					icon="i-lucide-trash-2"
					class="self-start rounded-full"
					@click="removeItem(index)"
				>
					Entfernen
				</UButton>
			</div>

			<div class="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)]">
				<div class="space-y-5">
					<div class="grid gap-4 md:grid-cols-3">
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
						<UTextarea v-model="item.description" :rows="4" placeholder="Beschreibung" />
					</UFormField>
				</div>

				<div class="rounded-[1.5rem] border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-5 dark:border-stone-800 dark:from-stone-900 dark:to-stone-950">
					<div class="mb-4 flex items-center justify-between gap-3">
						<span class="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400 dark:text-stone-500">
							Live-Vorschau
						</span>
						<div class="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
							<UIcon name="i-lucide-eye" class="h-4 w-4" />
							<span>Sichtbarer Kartenstil</span>
						</div>
					</div>
					<div class="rounded-[1.5rem] border border-stone-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
						<div :class="[getColorClasses(item.bgColor).bg, getColorClasses(item.iconColor).text, 'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl']">
							<UIcon :name="item.icon" class="h-7 w-7" />
						</div>
						<h5 class="text-lg font-semibold text-stone-900 dark:text-white">
							{{ getPreviewTitle(item) }}
						</h5>
						<p class="mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
							{{ getPreviewDescription(item) }}
						</p>
					</div>
				</div>
			</div>
		</div>

		<div v-if="items.length" class="flex justify-center">
			<UButton
				variant="outline"
				icon="i-lucide-plus"
				class="rounded-full"
				@click="addItem"
			>
				Weitere Karte hinzufügen
			</UButton>
		</div>
	</div>
</template>
