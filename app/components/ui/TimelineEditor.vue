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

const textareaUi = {
	root: "w-full",
	base: "w-full min-h-24 resize-y rounded-2xl px-4 py-3 leading-relaxed",
};

const fieldUi = {
	container: "w-full",
	label: "font-medium text-stone-700 dark:text-stone-200",
};

const entryCountLabel = computed(() => {
	if (items.value.length === 1) {
		return "1 Eintrag";
	}

	return `${items.value.length} Einträge`;
});

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

function updateItem(index: number, patch: Partial<TimelineItem>) {
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

function getPreviewTitle(item: TimelineItem) {
	return item.title.trim() || "Titel des Eintrags";
}
</script>

<template>
	<div class="space-y-6">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div class="flex items-center gap-3">
				<p class="text-base font-semibold text-stone-900 dark:text-white">
					Zeitstrahl-Editor
				</p>
				<UBadge color="neutral" variant="subtle" class="rounded-full">
					{{ entryCountLabel }}
				</UBadge>
			</div>
			<UButton
				variant="soft"
				icon="i-lucide-plus"
				class="self-start rounded-full"
				@click="addItem"
			>
				Eintrag hinzufügen
			</UButton>
		</div>

		<div
			v-if="!items.length"
			class="rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50/70 px-6 py-10 text-center dark:border-stone-700 dark:bg-stone-900/40"
		>
			<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-stone-800">
				<UIcon name="i-lucide-timeline" class="h-6 w-6 text-[var(--app-primary)]" />
			</div>
			<h4 class="text-base font-semibold text-stone-900 dark:text-white">
				Noch keine Stationen angelegt
			</h4>
			<p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500 dark:text-stone-400">
				Legen Sie den ersten Eintrag an, um die wichtigsten Momente der Geschichte zu pflegen.
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
						Eintrag {{ index + 1 }}
					</span>
					<span class="text-stone-300 dark:text-stone-600">-</span>
					<span>{{ getPreviewTitle(item) }}</span>
				</div>
				<div class="flex items-center gap-2">
					<UButton
						variant="ghost"
						size="xs"
						icon="i-lucide-chevron-up"
						class="rounded-full"
						:disabled="index === 0"
						@click="moveUp(index)"
					/>
					<UButton
						variant="ghost"
						size="xs"
						icon="i-lucide-chevron-down"
						class="rounded-full"
						:disabled="index === items.length - 1"
						@click="moveDown(index)"
					/>
					<UButton
						variant="ghost"
						size="xs"
						color="error"
						icon="i-lucide-trash-2"
						class="rounded-full"
						@click="removeItem(index)"
					/>
				</div>
			</div>

			<div class="space-y-5 p-5">
				<div class="grid gap-4 xl:grid-cols-3">
					<UFormField label="Datum" :ui="fieldUi">
						<UInput
							:model-value="item.date"
							placeholder="z.B. 1979/1980"
							class="w-full"
							@update:model-value="updateItem(index, { date: String($event ?? '') })"
						/>
					</UFormField>
					<UFormField label="Titel" :ui="fieldUi">
						<UInput
							:model-value="item.title"
							placeholder="Titel des Eintrags"
							class="w-full"
							@update:model-value="updateItem(index, { title: String($event ?? '') })"
						/>
					</UFormField>
					<UFormField label="Icon" :ui="fieldUi">
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
					</UFormField>
				</div>

				<UFormField label="Beschreibung" :ui="fieldUi">
					<UTextarea
						:model-value="item.description"
						:rows="3"
						:ui="textareaUi"
						placeholder="Beschreibung des Eintrags"
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
				Weiteren Eintrag hinzufügen
			</UButton>
		</div>
	</div>
</template>
