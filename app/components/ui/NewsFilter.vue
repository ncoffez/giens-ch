<script setup lang="ts">
const filters = defineModel<{
	search: string;
	tag: string;
	author: string;
	dateRange: string;
}>({ required: true });

const { $isReader, $isPublisher } = useNuxtApp();
const nuxtApp = useNuxtApp();

const isOpen = ref(false);

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

const categoryOptions = computed(() => {
	if (!labels.value) return [];
	
	const items = labels.value
		.filter(l => !l.private || $isReader.value)
		.map(l => ({
			id: l.id,
			label: l.title || l.id.charAt(0).toUpperCase() + l.id.slice(1),
			icon: iconMap[l.id.toLowerCase()] || 'i-lucide-tag'
		}));

	return [
		{ id: "all", label: "Alle Kategorien", icon: iconMap['all'] },
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

const hasActiveFilters = computed(() => {
	return filters.value.tag !== 'all' || filters.value.author !== 'all' || filters.value.dateRange !== 'all';
});

const activeCategoryLabel = computed(() => {
	return categoryOptions.value.find(c => c.id === filters.value.tag)?.label || 'Kategorie';
});
</script>

<template>
	<div class="space-y-4 mb-8">
		<!-- Main Search Row -->
		<div class="flex items-center gap-2">
			<div class="relative flex-1">
				<UInput
					v-model="filters.search"
					icon="i-lucide-search"
					size="xl"
					placeholder="Suchen nach Titeln, Inhalten oder Autoren..."
					class="w-full"
					:ui="{ 
						rounded: 'rounded-2xl',
						base: 'bg-white dark:bg-gray-950/50 shadow-sm border-gray-100 dark:border-gray-800 focus:ring-primary-500/50'
					}"
				>
					<template #trailing>
						<UButton
							v-if="filters.search.length > 0"
							icon="i-lucide-x"
							color="neutral"
							variant="ghost"
							size="xs"
							class="rounded-full"
							@click="filters.search = ''" />
					</template>
				</UInput>
			</div>
			<UButton
				v-if="$isPublisher"
				to="/news/new"
				color="primary"
				variant="soft"
				size="xl"
				class="rounded-2xl px-4"
				icon="i-lucide-plus"
			>
				<span class="hidden lg:inline font-bold">Neu</span>
			</UButton>
			<UButton
				:color="hasActiveFilters || isOpen ? 'primary' : 'neutral'"
				:variant="hasActiveFilters || isOpen ? 'solid' : 'ghost'"
				size="xl"
				class="rounded-2xl px-4"
				@click="isOpen = !isOpen"
			>
				<template #leading>
					<UIcon :name="isOpen ? 'i-lucide-chevron-up' : 'i-lucide-list-filter'" class="w-5 h-5" />
				</template>
				<span class="hidden md:inline font-bold">Filter</span>
				<template #trailing v-if="hasActiveFilters && !isOpen">
					<span class="flex h-2 w-2 rounded-full bg-white animate-pulse"></span>
				</template>
			</UButton>
		</div>

		<!-- Active Filter Chips (Visible when drawer is closed) -->
		<Transition
			enter-active-class="transition duration-200 ease-out"
			enter-from-class="transform scale-95 opacity-0"
			enter-to-class="transform scale-100 opacity-100"
			leave-active-class="transition duration-150 ease-in"
			leave-from-class="transform scale-100 opacity-100"
			leave-to-class="transform scale-95 opacity-0"
		>
			<div v-if="hasActiveFilters && !isOpen" class="flex flex-wrap gap-2 px-1">
				<UBadge
					v-if="filters.tag !== 'all'"
					variant="subtle"
					color="primary"
					class="rounded-full pl-1.5 pr-1 py-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
				>
					<UIcon :name="categoryOptions.find(c => c.id === filters.tag)?.icon || 'i-lucide-tag'" class="w-3 h-3" />
					<span>{{ categoryOptions.find(c => c.id === filters.tag)?.label }}</span>
					<UButton
						icon="i-lucide-x"
						variant="ghost"
						color="primary"
						size="xs"
						class="rounded-full p-0.5 hover:bg-primary-100 dark:hover:bg-primary-900/40"
						@click="filters.tag = 'all'"
					/>
				</UBadge>

				<UBadge
					v-if="filters.author !== 'all'"
					variant="subtle"
					color="neutral"
					class="rounded-full pl-1.5 pr-1 py-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
				>
					<UIcon name="i-lucide-user" class="w-3 h-3" />
					<span>{{ authorOptions.find(a => a.id === filters.author)?.label }}</span>
					<UButton
						icon="i-lucide-x"
						variant="ghost"
						color="neutral"
						size="xs"
						class="rounded-full p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800"
						@click="filters.author = 'all'"
					/>
				</UBadge>

				<UBadge
					v-if="filters.dateRange !== 'all'"
					variant="subtle"
					color="neutral"
					class="rounded-full pl-1.5 pr-1 py-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
				>
					<UIcon name="i-lucide-calendar" class="w-3 h-3" />
					<span>{{ dateOptions.find(d => d.id === filters.dateRange)?.label }}</span>
					<UButton
						icon="i-lucide-x"
						variant="ghost"
						color="neutral"
						size="xs"
						class="rounded-full p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800"
						@click="filters.dateRange = 'all'"
					/>
				</UBadge>
			</div>
		</Transition>

		<!-- Expandable Filter Drawer -->
		<Transition
			enter-active-class="transition-all duration-300 ease-out"
			enter-from-class="opacity-0 -translate-y-4 max-h-0"
			enter-to-class="opacity-100 translate-y-0 max-h-[500px]"
			leave-active-class="transition-all duration-200 ease-in"
			leave-from-class="opacity-100 translate-y-0 max-h-[500px]"
			leave-to-class="opacity-0 -translate-y-4 max-h-0"
		>
			<div v-if="isOpen" class="overflow-hidden">
				<div class="p-5 bg-gray-50 dark:bg-gray-900/40 rounded-3xl border border-gray-100 dark:border-gray-800/60 shadow-inner space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<!-- Category Select -->
						<div class="space-y-2">
							<label class="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 ml-1">Kategorie</label>
							<USelectMenu
								v-model="filters.tag"
								:items="categoryOptions"
								value-key="id"
								label-key="label"
								searchable
								placeholder="Kategorie wählen..."
								size="lg"
								class="w-full"
								:ui="{ rounded: 'rounded-xl' }"
							>
								<template #leading v-if="filters.tag !== 'all'">
									<UIcon :name="categoryOptions.find(c => c.id === filters.tag)?.icon || 'i-lucide-tag'" class="w-4 h-4" />
								</template>
							</USelectMenu>
						</div>

						<!-- Date Select -->
						<div class="space-y-2">
							<label class="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 ml-1">Zeitraum</label>
							<USelectMenu
								v-model="filters.dateRange"
								:items="dateOptions"
								value-key="id"
								label-key="label"
								size="lg"
								class="w-full"
								:ui="{ rounded: 'rounded-xl' }"
							/>
						</div>

						<!-- Author Select -->
						<div class="space-y-2">
							<label class="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 ml-1">Autor</label>
							<USelectMenu
								v-model="filters.author"
								:items="authorOptions"
								value-key="id"
								label-key="label"
								searchable
								size="lg"
								class="w-full"
								:ui="{ rounded: 'rounded-xl' }"
							/>
						</div>
					</div>

					<div class="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800/50">
						<div class="flex items-center gap-2 text-xs text-gray-500 font-medium italic">
							<UIcon name="i-lucide-info" class="w-3.5 h-3.5" />
							Filtern Sie nach Kategorien, Autoren oder Zeiträumen.
						</div>
						<UButton
							v-if="hasActiveFilters || filters.search"
							variant="ghost"
							color="error"
							size="sm"
							icon="i-lucide-x"
							class="font-black uppercase tracking-tighter"
							@click="filters = { search: '', tag: 'all', author: 'all', dateRange: 'all' }"
						>
							Alles Zurücksetzen
						</UButton>
					</div>
				</div>
			</div>
		</Transition>
	</div>
</template>
