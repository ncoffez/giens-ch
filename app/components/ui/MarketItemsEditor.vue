<script setup lang="ts">
import type { MarketItem } from "../../types";
import { getMarketDayKeys } from "~/utils/marketDays";

const props = defineProps<{
	modelValue: MarketItem[];
}>();

const emit = defineEmits<{
	"update:modelValue": [value: MarketItem[]];
}>();

const dayOptions = [
	{ value: "mon", label: "Mo", title: "Montag" },
	{ value: "tue", label: "Di", title: "Dienstag" },
	{ value: "wed", label: "Mi", title: "Mittwoch" },
	{ value: "thu", label: "Do", title: "Donnerstag" },
	{ value: "fri", label: "Fr", title: "Freitag" },
	{ value: "sat", label: "Sa", title: "Samstag" },
	{ value: "sun", label: "So", title: "Sonntag" },
];

const descriptionMaxLength = 160;

function normalizeMarketItem(item: Partial<MarketItem>): MarketItem {
	return {
		dayKeys: getMarketDayKeys(item),
		label: item.label || "",
		description: item.description || "",
	};
}

function hasSameDayKeys(left: readonly string[], right: unknown) {
	return Array.isArray(right)
		&& left.length === right.length
		&& left.every((dayKey, index) => dayKey === right[index]);
}

const items = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

watch(
	() => props.modelValue,
	(value) => {
		const normalizedItems = value.map((item) => normalizeMarketItem(item));
		const needsNormalization = normalizedItems.some((item, index) => {
			const original = value[index];
			return original.dayKey !== undefined
				|| !hasSameDayKeys(item.dayKeys, original.dayKeys)
				|| item.label !== original.label
				|| item.description !== original.description;
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
		normalizeMarketItem({}),
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

function updateDescription(index: number, value: string) {
	const nextItems = [...items.value];
	nextItems[index] = {
		...normalizeMarketItem(nextItems[index]),
		description: value.slice(0, descriptionMaxLength),
	};
	items.value = nextItems;
}

function isDaySelected(item: Partial<MarketItem>, dayKey: string) {
	return getMarketDayKeys(item).includes(dayKey);
}

function toggleDay(index: number, dayKey: string) {
	const nextItems = [...items.value];
	const current = normalizeMarketItem(nextItems[index]);
	const selected = current.dayKeys.includes(dayKey);

	// At least one weekday stays selected.
	if (selected && current.dayKeys.length === 1) return;

	nextItems[index] = {
		...current,
		dayKeys: getMarketDayKeys({
			dayKeys: selected
				? current.dayKeys.filter((key) => key !== dayKey)
				: [...current.dayKeys, dayKey],
		}),
	};
	items.value = nextItems;
}

function getDescriptionValue(item: Partial<MarketItem>) {
	return item.description || "";
}
</script>

<template>
	<div class="space-y-6">
		<div class="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-950">
			<div class="border-b border-stone-200/80 bg-stone-50/80 px-5 py-4 dark:border-stone-800 dark:bg-stone-900/70">
				<div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400 dark:text-stone-500">
							Markt-Tabelle
						</p>
						<h4 class="text-base font-semibold text-stone-900 dark:text-white">
							Wochentage, Orte und Kurzbeschreibungen kompakt pflegen
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
								Wochentage
							</th>
							<th class="border-b border-stone-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-stone-500 dark:border-stone-800">
								Ort / Eintrag
							</th>
							<th class="border-b border-stone-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-stone-500 dark:border-stone-800">
								Kurzbeschreibung
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
								<div class="flex min-w-60 flex-wrap gap-1" role="group" aria-label="Wochentage">
									<UButton
										v-for="day in dayOptions"
										:key="day.value"
										size="xs"
										:color="isDaySelected(item, day.value) ? 'primary' : 'neutral'"
										:variant="isDaySelected(item, day.value) ? 'solid' : 'outline'"
										:title="day.title"
										:aria-pressed="isDaySelected(item, day.value)"
										class="min-w-8 justify-center"
										@click="toggleDay(index, day.value)"
									>
										{{ day.label }}
									</UButton>
								</div>
							</td>
							<td class="border-b border-stone-200 px-4 py-3 dark:border-stone-800">
								<UInput
									v-model="item.label"
									placeholder="z.B. Giens oder Flohmarkt in La Capte"
									class="min-w-64"
								/>
							</td>
							<td class="border-b border-stone-200 px-4 py-3 dark:border-stone-800">
								<div class="flex min-w-80 items-center gap-3">
									<UInput
										:model-value="getDescriptionValue(item)"
										placeholder="z.B. Gemüse, Käse, Fisch oder Flohmarktstände"
										:maxlength="descriptionMaxLength"
										class="min-w-0 flex-1"
										@update:model-value="updateDescription(index, String($event ?? ''))"
									/>
									<div class="shrink-0 text-xs text-stone-400 dark:text-stone-500">
										{{ getDescriptionValue(item).length }} / {{ descriptionMaxLength }}
									</div>
								</div>
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
				Noch keine Märkte angelegt.
			</div>

			<div class="border-t border-stone-200/80 px-5 py-4 dark:border-stone-800">
				<UButton variant="outline" icon="i-lucide-plus" @click="addItem">
					Markt hinzufügen
				</UButton>
			</div>
		</div>
	</div>
</template>
