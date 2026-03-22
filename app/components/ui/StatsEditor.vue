<script setup lang="ts">
import type { StatItem } from "../../types";

const props = defineProps<{
	modelValue: StatItem[];
}>();

const emit = defineEmits<{
	"update:modelValue": [value: StatItem[]];
}>();

const items = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
});

function addItem() {
	items.value = [
		...items.value,
		{
			value: "",
			label: "",
		},
	];
}

function removeItem(index: number) {
	items.value = items.value.filter((_, i) => i !== index);
}
</script>

<template>
	<div class="space-y-4">
		<div
			v-for="(item, index) in items"
			:key="index"
			class="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700"
		>
			<div class="flex items-center justify-between mb-4">
				<span class="text-sm font-bold text-stone-500">Statistik {{ index + 1 }}</span>
				<UButton
					variant="ghost"
					size="xs"
					color="error"
					icon="i-lucide-trash-2"
					@click="removeItem(index)"
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<UFormField label="Wert">
					<UInput v-model="item.value" placeholder="z.B. 20 oder 40+" />
				</UFormField>
				<UFormField label="Label">
					<UInput v-model="item.label" placeholder="z.B. Häuser" />
				</UFormField>
			</div>
		</div>

		<UButton
			variant="outline"
			icon="i-lucide-plus"
			@click="addItem"
		>
			Statistik hinzufügen
		</UButton>
	</div>
</template>
