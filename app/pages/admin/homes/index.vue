<script setup lang="ts">
definePageMeta({ middleware: ["is-admin"] });

const { $token } = useNuxtApp();
const toast = useToast();

const homes = ref<any[]>([]);
const loading = ref(true);
const initializing = ref(false);
const error = ref<string | null>(null);
const showDisabled = ref(false);

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

const initializeHomes = async () => {
	try {
		initializing.value = true;
		const result = await $fetch("/api/admin/homes/initialize", {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
		});
		toast.add({ title: `Created ${result.created} homes successfully`, color: "green" });
		await fetchHomes();
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Failed to initialize homes", color: "red" });
	} finally {
		initializing.value = false;
	}
};

const deleteHome = async (homeId: string) => {
	if (!confirm("Are you sure you want to delete this home? This cannot be undone.")) return;

	try {
		await $fetch(`/api/admin/homes/${homeId}/delete`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
		});
		toast.add({ title: "Home deleted successfully", color: "green" });
		await fetchHomes();
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Failed to delete home", color: "red" });
	}
};

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
		<div class="flex items-center justify-between mb-8">
			<h1 class="text-3xl font-bold">Häuser Verwaltung</h1>
			<UButton icon="i-lucide-plus" :loading="initializing" @click="initializeHomes">
				Häuser Initialisieren
			</UButton>
		</div>

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
			<UTable :data="homes" :columns="[
				{ id: 'name', header: 'Name' },
				{ id: 'owner', header: 'Eigentümer' },
				{ id: 'status', header: 'Status' },
				{ id: 'actions', header: 'Aktionen' },
			]">
				<template #name-cell="{ row }">
					<span class="font-medium">{{ row.name }}</span>
				</template>

				<template #owner-cell="{ row }">
					<span class="text-gray-500">{{ row.ownerId ? "Zugewiesen" : "-" }}</span>
				</template>

				<template #status-cell="{ row }">
					<UChip :color="row.enabled ? 'green' : 'red'" size="md">
						{{ row.enabled ? 'Aktiv' : 'Deaktiviert' }}
					</UChip>
				</template>

				<template #actions-cell="{ row }">
					<div class="flex gap-2">
						<UButton size="sm" variant="ghost" :to="`/admin/homes/${row.id}/edit`">
							Bearbeiten
						</UButton>
						<UButton size="sm" color="red" variant="ghost" @click="deleteHome(row.id)">
							<UIcon name="i-lucide-trash-2" />
						</UButton>
					</div>
				</template>
			</UTable>
		</UCard>
	</div>
</template>