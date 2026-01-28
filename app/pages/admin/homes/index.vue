<script setup lang="ts">
definePageMeta({ middleware: ["is-admin"] });

const { $token } = useNuxtApp();
const toast = useToast();

const homes = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const showDisabled = ref(false);
const cleaning = ref(false);
const bootstrapSectionVisible = ref(false);

const sortedHomes = computed(() => {
	return [...(homes.value || [])].sort((a, b) => {
		const extractNumber = (name: string | undefined) => {
			const match = name?.match(/Haus\s*(\d+)/i);
			return match ? parseInt(match[1], 10) : 9999;
		};
		return extractNumber(a.name) - extractNumber(b.name);
	});
});

const fetchHomes = async () => {
	try {
		loading.value = true;
		error.value = null;
		homes.value = await $fetch("/api/admin/homes", {
			headers: { Authorization: `Bearer ${$token.value}` },
			query: { showDisabled: showDisabled.value ? "1" : "0" },
		});
	} catch (e: any) {
		error.value = e.data?.message || e.message || "Failed to load homes";
	} finally {
		loading.value = false;
	}
};

const deleteHome = async (homeId: string) => {
	if (!confirm("Are you sure you want to delete this home? This cannot be undone.")) return;

	try {
		await $fetch(`/api/admin/homes/${homeId}/delete`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
		});
		toast.add({ title: "Home deleted successfully", color: "success" });
		await fetchHomes();
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Failed to delete home", color: "error" });
	}
};



const getHomeItems = (home: any) => [
	[
		{
			label: "Bearbeiten",
			icon: "i-lucide-pencil",
			onSelect: () => navigateTo(`/admin/homes/${home.id}/edit`)
		},
		{
			label: home.enabled ? "Deaktivieren" : "Aktivieren",
			icon: home.enabled ? "i-lucide-toggle-left" : "i-lucide-toggle-right",
			onSelect: () => {
				$fetch(`/api/admin/homes/${home.id}/update`, {
					method: "POST",
					headers: { Authorization: `Bearer ${$token.value}` },
					body: { enabled: !home.enabled }
				}).then(() => {
					toast.add({ title: `Haus ${home.enabled ? 'deaktiviert' : 'aktiviert'}`, color: "success" });
					fetchHomes();
				});
			}
		}
	],
	[
		{
			label: "Löschen",
			icon: "i-lucide-trash-2",
			color: "error" as const,
			onSelect: () => {
				if (confirm("Haus wirklich löschen?")) {
					deleteHome(home.id);
				}
			}
		}
	]
];

onMounted(fetchHomes);
watch(showDisabled, fetchHomes);

watchEffect(() => {
	if (homes.value.some(h => !h.id)) {
		console.error("Found home without ID:", homes.value.filter(h => !h.id));
	}
});
</script>

<template>
	<div class="max-w-screen-2xl mx-auto px-4 py-8">
		<h1 class="text-3xl font-bold mb-8">Häuser Verwaltung</h1>

		<UCard class="mb-6">
			<div class="flex items-center gap-4">
				<USwitch v-model="showDisabled" label="Deaktivierte Häuser anzeigen" />
				<span class="text-sm text-gray-500">
					{{ homes.filter((h) => h.enabled).length }} aktiv · {{ homes.filter((h) => !h.enabled).length }} deaktiviert
				</span>
			</div>
		</UCard>

		<div v-if="loading" class="text-center py-8">Loading...</div>

		<div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>

		<UCard v-else>
			<UTable :data="sortedHomes" :columns="[
				{ id: 'name', header: 'Name', accessorKey: 'name' },
				{ id: 'ownerId', header: 'Eigentümer', accessorKey: 'ownerId' },
				{ id: 'enabled', header: 'Status', accessorKey: 'enabled' },
				{ id: 'actions', header: 'Aktionen' },
			]">
				<template #name-cell="{ row }">
					<span class="font-medium">{{ row.original.name }}</span>
				</template>

				<template #ownerId-cell="{ row }">
					<span class="text-gray-500">{{ row.original.ownerId ? "Zugewiesen" : "-" }}</span>
				</template>

				<template #enabled-cell="{ row }">
					<UChip :color="row.original.enabled ? 'success' : 'error'" size="md">
						{{ row.original.enabled ? 'Aktiv' : 'Deaktiviert' }}
					</UChip>
				</template>

				<template #actions-cell="{ row }">
					<UDropdownMenu :items="getHomeItems(row.original)">
						<UButton color="neutral" variant="ghost" icon="i-lucide-ellipsis-vertical" size="lg" />
					</UDropdownMenu>
				</template>
			</UTable>
		</UCard>
	</div>
</template>