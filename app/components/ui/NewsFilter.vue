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

const iconMap: Record<string, string> = {
	'association': 'i-lucide-building',
	'news': 'i-lucide-megaphone',
	'dokumente': 'i-lucide-file-text',
	'photos': 'i-lucide-camera',
	'travaux': 'i-lucide-hard-hat',
	'events': 'i-lucide-calendar',
	'all': 'i-lucide-layout-grid'
};

const availableTags = computed(() => {
	if (!labels.value) return [];
	
	const items = labels.value
		.filter(l => !l.private || $isReader.value)
		.map(l => ({
			id: l.id,
			label: l.title || l.id.charAt(0).toUpperCase() + l.id.slice(1),
			icon: iconMap[l.id.toLowerCase()] || 'i-lucide-tag'
		}));

	return [
		{ id: "all", label: "Alle", icon: iconMap['all'] },
		...items
	];
});

const dateOptions = [
	{ id: 'all', label: 'Alle Zeiträume' },
	{ id: 'this-month', label: 'Diesen Monat' },
	{ id: 'last-6-months', label: 'Letzte 6 Monate' },
	{ id: 'this-year', label: 'Dieses Jahr' },
];

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
	<div class="space-y-6 mb-12">
		<!-- Search Bar -->
		<div class="relative max-w-2xl mx-auto">
			<UInput
				v-model="filters.search"
				icon="i-lucide-search"
				size="xl"
				placeholder="Suchen nach Titeln, Inhalten oder Autoren..."
				class="w-full"
				:ui="{ 
					rounded: 'rounded-2xl',
					base: 'bg-white dark:bg-gray-900/50 shadow-sm border-gray-100 dark:border-gray-800'
				}"
			/>
		</div>

		<!-- Category Pills -->
		<div class="flex flex-wrap justify-center gap-2">
			<button
				v-for="tag in availableTags"
				:key="tag.id"
				@click="filters.tag = tag.id"
				class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 border"
				:class="[
					filters.tag === tag.id 
						? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
						: 'bg-white dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800'
				]"
			>
				<UIcon :name="tag.icon" class="w-4 h-4" />
				<span>{{ tag.label }}</span>
			</button>
		</div>

		<!-- Secondary Filters -->
		<div class="flex flex-wrap justify-center items-center gap-4 pt-2">
			<div class="flex items-center gap-2">
				<UIcon name="i-lucide-calendar" class="text-gray-400 w-4 h-4" />
				<USelect
					v-model="filters.dateRange"
					:items="dateOptions"
					value-key="id"
					label-key="label"
					variant="ghost"
					color="neutral"
					class="font-bold text-sm"
				/>
			</div>

			<div class="w-px h-4 bg-gray-200 dark:bg-gray-800"></div>

			<div class="flex items-center gap-2">
				<UIcon name="i-lucide-user" class="text-gray-400 w-4 h-4" />
				<USelect
					v-model="filters.author"
					:items="authorOptions"
					value-key="id"
					label-key="label"
					variant="ghost"
					color="neutral"
					class="font-bold text-sm"
				/>
			</div>

			<UButton
				v-if="filters.search || filters.tag !== 'all' || filters.author !== 'all' || filters.dateRange !== 'all'"
				variant="link"
				color="error"
				size="sm"
				icon="i-lucide-x"
				class="font-bold"
				@click="filters = { search: '', tag: 'all', author: 'all', dateRange: 'all' }"
			>
				Zurücksetzen
			</UButton>
		</div>
	</div>
</template>
