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
	{ value: "i-lucide-sun", label: "Sonne" },
	{ value: "i-lucide-heart-handshake", label: "Handshake" },
	{ value: "i-lucide-trees", label: "Bäume" },
	{ value: "i-lucide-car", label: "Auto" },
	{ value: "i-lucide-wifi", label: "WLAN" },
	{ value: "i-lucide-utensils", label: "Besteck" },
	{ value: "i-lucide-bike", label: "Velo" },
	{ value: "i-lucide-waves", label: "Wellen" },
	{ value: "i-lucide-mountain", label: "Berg" },
];

const colorOptions = [
	{ value: "blue", label: "Blau" },
	{ value: "amber", label: "Bernstein" },
	{ value: "rose", label: "Rose" },
	{ value: "emerald", label: "Smaragd" },
	{ value: "purple", label: "Lila" },
	{ value: "cyan", label: "Cyan" },
];

const textareaUi = {
	root: "w-full",
	base: "w-full min-h-24 resize-y rounded-2xl px-4 py-3 leading-relaxed",
};

const fieldUi = {
	container: "w-full",
	label: "font-medium text-stone-700 dark:text-stone-200",
};

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

function updateItem(index: number, patch: Partial<FeatureCard>) {
	items.value = items.value.map((item, itemIndex) => {
		if (itemIndex !== index) {
			return item;
		}

		return {
			...item,
			...patch,
		};
	});
}

function getColorPillClass(color: string) {
	const colors: Record<string, string> = {
		blue: "bg-blue-500",
		amber: "bg-amber-500",
		rose: "bg-rose-500",
		emerald: "bg-emerald-500",
		purple: "bg-purple-500",
		cyan: "bg-cyan-500",
	};

	return colors[color] || "bg-stone-400";
}

function getPreviewTitle(item: FeatureCard) {
	return item.title.trim() || "Titel der Karte";
}
</script>

<template>
	<div class="space-y-6">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div class="flex items-center gap-3">
				<p class="text-base font-semibold text-stone-900 dark:text-white">
					Karteneditor
				</p>
				<UBadge color="neutral" variant="subtle" class="rounded-full">
					{{ cardCountLabel }}
				</UBadge>
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
				<div class="flex items-center gap-2 text-base font-semibold text-stone-900 dark:text-white">
					<span class="text-sm font-semibold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
						Karte {{ index + 1 }}
					</span>
					<span class="text-stone-300 dark:text-stone-600">-</span>
					<span>{{ getPreviewTitle(item) }}</span>
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

			<div class="space-y-5 p-5">
				<div class="grid gap-4 xl:grid-cols-4">
					<UFormField label="Titel" :ui="fieldUi">
						<UInput
							:model-value="item.title"
							placeholder="Titel der Karte"
							class="w-full"
							@update:model-value="updateItem(index, { title: String($event ?? '') })"
						/>
					</UFormField>
					<UFormField label="Icon" :ui="fieldUi">
						<div class="w-full">
							<USelect
								:model-value="item.icon"
								:items="iconOptions"
								class="w-full"
								:ui="{ content: 'min-w-56', item: 'items-center gap-2' }"
								@update:model-value="updateItem(index, { icon: String($event ?? '') })"
							>
								<template #default="{ modelValue }">
									<div class="flex items-center gap-2">
										<UIcon :name="String(modelValue)" class="h-4 w-4 shrink-0" />
										<span>{{ iconOptions.find((option) => option.value === modelValue)?.label || "Icon wählen" }}</span>
									</div>
								</template>
								<template #item-label="{ item: iconOption }">
									<div class="flex items-center gap-2">
										<UIcon :name="iconOption.value" class="h-4 w-4 shrink-0" />
										<span>{{ iconOption.label }}</span>
									</div>
								</template>
							</USelect>
						</div>
					</UFormField>
					<UFormField label="Hintergrund" :ui="fieldUi">
						<USelect
							:model-value="item.bgColor"
							:items="colorOptions"
							class="w-full"
							:ui="{ content: 'min-w-48', item: 'items-center gap-2' }"
							@update:model-value="updateItem(index, { bgColor: String($event ?? '') })"
						>
							<template #default="{ modelValue }">
								<div class="flex items-center gap-2">
									<div :class="[getColorPillClass(String(modelValue)), 'h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/8 dark:ring-white/10']" />
									<span>{{ colorOptions.find((option) => option.value === modelValue)?.label || "Farbe wählen" }}</span>
								</div>
							</template>
							<template #item-label="{ item: colorOption }">
								<div class="flex items-center gap-2">
									<div :class="[getColorPillClass(colorOption.value), 'h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/8 dark:ring-white/10']" />
									<span>{{ colorOption.label }}</span>
								</div>
							</template>
						</USelect>
					</UFormField>
					<UFormField label="Icon-Farbe" :ui="fieldUi">
						<USelect
							:model-value="item.iconColor"
							:items="colorOptions"
							class="w-full"
							:ui="{ content: 'min-w-48', item: 'items-center gap-2' }"
							@update:model-value="updateItem(index, { iconColor: String($event ?? '') })"
						>
							<template #default="{ modelValue }">
								<div class="flex items-center gap-2">
									<div :class="[getColorPillClass(String(modelValue)), 'h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/8 dark:ring-white/10']" />
									<span>{{ colorOptions.find((option) => option.value === modelValue)?.label || "Farbe wählen" }}</span>
								</div>
							</template>
							<template #item-label="{ item: colorOption }">
								<div class="flex items-center gap-2">
									<div :class="[getColorPillClass(colorOption.value), 'h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/8 dark:ring-white/10']" />
									<span>{{ colorOption.label }}</span>
								</div>
							</template>
						</USelect>
					</UFormField>
				</div>

				<UFormField label="Beschreibung" :ui="fieldUi">
					<UTextarea
						:model-value="item.description"
						:rows="3"
						:ui="textareaUi"
						placeholder="Beschreibung"
						@update:model-value="updateItem(index, { description: String($event ?? '') })"
					/>
				</UFormField>
			</div>
		</div>

		<div
			v-if="items.length"
			class="flex items-center justify-center border-t border-stone-200/70 pt-2 dark:border-stone-800/80"
		>
			<UButton
				variant="ghost"
				color="neutral"
				icon="i-lucide-plus"
				class="rounded-full text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
				@click="addItem"
			>
				Weitere Karte hinzufügen
			</UButton>
		</div>
	</div>
</template>
