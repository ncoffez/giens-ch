<script setup lang="ts">
import type { LinkItem } from "../../../types";

const props = defineProps<{
	modelValue: LinkItem[];
}>();

const emit = defineEmits<{
	"update:modelValue": [value: LinkItem[]];
}>();

const descriptionMaxLength = 160;

function normalizeLinkItem(item: Partial<LinkItem>): LinkItem {
	return {
		title: item.title || "",
		description: item.description || "",
		url: item.url || "",
	};
}

const items = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

watch(
	() => props.modelValue,
	(value) => {
		const normalizedItems = value.map((item) => normalizeLinkItem(item));
		const needsNormalization = normalizedItems.some((item, index) => {
			const original = value[index];
			return !original
				|| item.title !== original.title
				|| item.description !== original.description
				|| item.url !== original.url;
		});

		if (needsNormalization) {
			emit("update:modelValue", normalizedItems);
		}
	},
	{ deep: true, immediate: true },
);

function addItem() {
	items.value = [
		...items.value,
		normalizeLinkItem({}),
	];
}

function removeItem(index: number) {
	items.value = items.value.filter((_, itemIndex) => itemIndex !== index);
}

function moveUp(index: number) {
	if (index === 0) return;
	const nextItems = [...items.value];
	[nextItems[index - 1], nextItems[index]] = [nextItems[index]!, nextItems[index - 1]!];
	items.value = nextItems;
}

function moveDown(index: number) {
	if (index >= items.value.length - 1) return;
	const nextItems = [...items.value];
	[nextItems[index], nextItems[index + 1]] = [nextItems[index + 1]!, nextItems[index]!];
	items.value = nextItems;
}

function updateField(index: number, field: "title" | "description" | "url", value: string) {
	const nextItems = [...items.value];
	const nextValue = field === "description" ? value.slice(0, descriptionMaxLength) : value;
	nextItems[index] = {
		...normalizeLinkItem(nextItems[index] || {}),
		[field]: nextValue,
	};
	items.value = nextItems;
}

function getFieldValue(item: Partial<LinkItem>, field: "title" | "description" | "url") {
	return item[field] || "";
}
</script>

<template>
	<div class="space-y-6">
		<div class="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-950">
			<div class="border-b border-stone-200/80 bg-stone-50/80 px-5 py-4 dark:border-stone-800 dark:bg-stone-900/70">
				<div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400 dark:text-stone-500">
							Links-Tabelle
						</p>
						<h4 class="text-base font-semibold text-stone-900 dark:text-white">
							Nützliche externe Links mit Titel, Beschreibung und URL pflegen
						</h4>
					</div>
					<UBadge color="neutral" variant="subtle" class="rounded-full self-start md:self-auto">
						{{ items.length }} Einträge
					</UBadge>
				</div>
			</div>

			<div v-if="items.length" class="overflow-x-auto">
				<table class="min-w-full border-separate border-spacing-0">
					<thead>
						<tr class="bg-stone-50 dark:bg-stone-900/60">
							<th class="border-b border-stone-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-stone-500 dark:border-stone-800">
								Reihenfolge
							</th>
							<th class="border-b border-stone-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-stone-500 dark:border-stone-800">
								Titel
							</th>
							<th class="border-b border-stone-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-stone-500 dark:border-stone-800">
								Kurzbeschreibung
							</th>
							<th class="border-b border-stone-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-stone-500 dark:border-stone-800">
								URL
							</th>
							<th class="border-b border-stone-200 px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.18em] text-stone-500 dark:border-stone-800">
								Aktionen
							</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="(item, index) in items"
							:key="index"
							class="align-top"
						>
							<td class="border-b border-stone-200 px-4 py-3 text-sm text-stone-500 dark:border-stone-800 dark:text-stone-400">
								<div class="flex items-center gap-1">
									<span class="min-w-6 font-semibold">{{ index + 1 }}</span>
									<div class="flex flex-col">
										<UButton variant="ghost" size="xs" icon="i-lucide-chevron-up" :disabled="index === 0" @click="moveUp(index)" />
										<UButton variant="ghost" size="xs" icon="i-lucide-chevron-down" :disabled="index === items.length - 1" @click="moveDown(index)" />
									</div>
								</div>
							</td>
							<td class="border-b border-stone-200 px-4 py-3 dark:border-stone-800">
								<UInput
									:model-value="getFieldValue(item, 'title')"
									placeholder="z.B. Office de Tourisme Hyères"
									class="min-w-48"
									@update:model-value="updateField(index, 'title', String($event ?? ''))"
								/>
							</td>
							<td class="border-b border-stone-200 px-4 py-3 dark:border-stone-800">
								<div class="flex min-w-72 items-center gap-3">
									<UInput
										:model-value="getFieldValue(item, 'description')"
										placeholder="z.B. Öffentliche Verkehrsmittel, Veranstaltungen und Sehenswürdigkeiten"
										:maxlength="descriptionMaxLength"
										class="min-w-0 flex-1"
										@update:model-value="updateField(index, 'description', String($event ?? ''))"
									/>
									<div class="shrink-0 text-xs text-stone-400 dark:text-stone-500">
										{{ getFieldValue(item, 'description').length }} / {{ descriptionMaxLength }}
									</div>
								</div>
							</td>
							<td class="border-b border-stone-200 px-4 py-3 dark:border-stone-800">
								<UInput
									:model-value="getFieldValue(item, 'url')"
									type="url"
									placeholder="https://…"
									class="min-w-56"
									@update:model-value="updateField(index, 'url', String($event ?? ''))"
								/>
							</td>
							<td class="border-b border-stone-200 px-4 py-3 text-right dark:border-stone-800">
								<UButton variant="ghost" size="sm" color="error" icon="i-lucide-trash-2" @click="removeItem(index)">
									Löschen
								</UButton>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
			<div
				v-else
				class="px-6 py-10 text-center text-sm text-stone-500 dark:text-stone-400"
			>
				Noch keine Links angelegt.
			</div>

			<div class="border-t border-stone-200/80 px-5 py-4 dark:border-stone-800">
				<UButton variant="outline" icon="i-lucide-plus" @click="addItem">
					Link hinzufügen
				</UButton>
			</div>
		</div>
	</div>
</template>
