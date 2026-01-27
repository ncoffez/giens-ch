<script setup lang="ts">
const filters = defineModel<{
	search: string;
	tag: string;
	author: string;
	dateRange: string;
}>({ required: true });

const { $isReader } = useNuxtApp();
const nuxtApp = useNuxtApp();

const { data: labels } = await useFetch<any[]>("/api/labels", {
	key: "labels-list",
	getCachedData(key) {
		if (import.meta.test) return;
		return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
	},
});

const availableTags = computed(() => {
	if (!labels.value) return [];
	
	const items = labels.value
		.filter(l => !l.private || $isReader.value)
		.map(l => ({
			id: l.id,
			label: l.title || l.id.charAt(0).toUpperCase() + l.id.slice(1),
		}));

	return [
		{ id: "all", label: "Alle Kategorien" },
		...items
	];
});

const dateOptions = [
	{ id: 'all', label: 'Alle Zeiträume' },
	{ id: 'this-month', label: 'Diesen Monat' },
	{ id: 'last-6-months', label: 'Letzte 6 Monate' },
	{ id: 'this-year', label: 'Dieses Jahr' },
];

// However, the user specifically asked for an author filter.
// Let's assume we can get authors from the current articles or a specific endpoint.
const { data: authors } = await useFetch<{id: string, name: string}[]>("/api/authors", {
	key: (import.meta.test ? Math.random().toString() : "authors-list"),
	default: () => []
});

const authorOptions = computed(() => [
	{ id: 'all', label: 'Alle Autoren' },
	...(authors.value || []).map(a => ({ id: a.id, label: a.name }))
]);
</script>

<template>
	<div class="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm mb-8">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<!-- Search -->
			<UFormField label="Suche">
				<UInput
					v-model="filters.search"
					icon="i-lucide-search"
					placeholder="Titel, Inhalt oder Autor..."
					class="w-full"
				/>
			</UFormField>

			<!-- Tags -->
			<UFormField label="Kategorie">
				<USelect
					v-model="filters.tag"
					:items="availableTags"
					value-key="id"
					label-key="label"
					class="w-full"
				/>
			</UFormField>

			<!-- Date Range -->
			<UFormField label="Zeitraum">
				<USelect
					v-model="filters.dateRange"
					:items="dateOptions"
					value-key="id"
					label-key="label"
					class="w-full"
				/>
			</UFormField>

			<!-- Author -->
			<UFormField label="Autor">
				<USelect
					v-model="filters.author"
					:items="authorOptions"
					value-key="id"
					label-key="label"
					class="w-full"
				/>
			</UFormField>
		</div>
		
		<div class="flex justify-end mt-4" v-if="filters.search || filters.tag !== 'all' || filters.author !== 'all' || filters.dateRange !== 'all'">
			<UButton
				variant="ghost"
				color="neutral"
				size="sm"
				icon="i-lucide-x"
				@click="filters = { search: '', tag: 'all', author: 'all', dateRange: 'all' }"
			>
				Filter zurücksetzen
			</UButton>
		</div>
	</div>
</template>
