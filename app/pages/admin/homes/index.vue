<script setup lang="ts">
definePageMeta({
    middleware: ["is-admin"],
    render: 'client'
});

const { waitForAuth, token } = useAuthReady();
const toast = useToast();

const allHomes = ref<any[]>([]);
const homes = ref<any[]>([]);
const owners = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const showDisabled = ref(false);
const cleaning = ref(false);
const bootstrapSectionVisible = ref(false);

const totalActive = computed(() => allHomes.value.filter((h) => h.enabled).length);
const totalDisabled = computed(() => allHomes.value.filter((h) => !h.enabled).length);

const ownerMap = computed(() => {
	const map = new Map<string, any>();
	owners.value.forEach((o) => map.set(o.uid, o));
	return map;
});

const getOwners = (home: any) => {
	return (home.ownerIds || []).map((uid) => ownerMap.value.get(uid)).filter(Boolean);
};

const getOwnerInitials = (displayName: string) => {
	return displayName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
};

const sortedHomes = computed(() => {
	const extractedNumbers = new Map();

	return [...(homes.value || [])].sort((a, b) => {
		if (a.enabled !== b.enabled) {
			return b.enabled ? 1 : -1;
		}

		const extractNumber = (name: string | undefined) => {
			const match = name?.match(/Haus\s*(\d+)/i);
			return match ? parseInt(match[1], 10) : 9999;
		};
		return extractNumber(a.name) - extractNumber(b.name);
	});
});

const fetchHomes = async () => {
	try {
		await waitForAuth();
		loading.value = true;
		error.value = null;
		allHomes.value = await $fetch("/api/admin/homes", {
			headers: { Authorization: `Bearer ${token.value}` },
		});
		homes.value = showDisabled.value
			? allHomes.value
			: allHomes.value.filter((h) => h.enabled);
	} catch (e: unknown) {
		error.value = getFetchError(e) || "Failed to load homes";
	} finally {
		loading.value = false;
	}
};

const deleteHome = async (homeId: string) => {
	if (!confirm("Are you sure you want to delete this home? This cannot be undone."))
		return;

	try {
		await $fetch(`/api/admin/homes/${homeId}/delete`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
		});
		toast.add({ title: "Home deleted successfully", color: "success" });
		await fetchHomes();
	} catch (e: unknown) {
		toast.add({
			title: getFetchError(e) || "Failed to delete home",
			color: "error",
		});
	}
};

const getHomeItems = (home: any) => [
	[
		{
			label: "Bearbeiten",
			icon: "i-lucide-pencil",
			onSelect: () => navigateTo(`/admin/homes/${home.id}/edit`),
		},
		{
			label: home.enabled ? "Deaktivieren" : "Aktivieren",
			icon: home.enabled ? "i-lucide-toggle-left" : "i-lucide-toggle-right",
			onSelect: () => {
				$fetch(`/api/admin/homes/${home.id}/update`, {
					method: "POST",
					headers: { Authorization: `Bearer ${token.value}` },
					body: { enabled: !home.enabled },
				}).then(() => {
					toast.add({
						title: `Haus ${home.enabled ? "deaktiviert" : "aktiviert"}`,
						color: "success",
					});
					fetchHomes();
				});
			},
		},
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
			},
		},
	],
];

watch(showDisabled, () => {
	homes.value = showDisabled.value
		? allHomes.value
		: allHomes.value.filter((h) => h.enabled);
});

onMounted(() => {
	fetchHomes();
	$fetch("/api/users/owners", {
		headers: { Authorization: `Bearer ${token.value}` },
	}).then((data) => (owners.value = data));
});

watchEffect(() => {
	if (homes.value.some((h) => !h.id)) {
		console.error(
			"Found home without ID:",
			homes.value.filter((h) => !h.id),
		);
	}
});
</script>

<template>
	<div class="max-w-screen-2xl mx-auto px-4 py-8">
		<h1 class="text-3xl font-bold mb-8">Häuser Verwaltung</h1>

		<UCard class="mb-6">
			<div class="flex items-center justify-between">
				<ClientOnly>
					<USwitch
						v-model="showDisabled"
						label="Deaktivierte Häuser anzeigen" 
					/>
				</ClientOnly>
				<span class="ml-auto text-sm text-stone-500 w-fit">
					{{ totalActive }} aktiv · {{ totalDisabled }} deaktiviert
				</span>
			</div>
		</UCard>

		<div v-if="loading" class="text-center py-8">Loading...</div>

		<div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>

		<UCard v-else>
			<UTable
				:data="sortedHomes"
				:columns="[
					{ id: 'name', header: 'Name', accessorKey: 'name' },
					{ id: 'ownerIds', header: 'Eigentümer', accessorKey: 'ownerIds' },
					{ id: 'enabled', header: 'Status', accessorKey: 'enabled' },
					{ id: 'actions', header: 'Aktionen' },
				]">
				<template #name-cell="{ row }">
					<span class="font-medium">{{ row.original.name }}</span>
				</template>

				<template #ownerIds-cell="{ row }">
					<div>
						<span
							v-if="!row.original.ownerIds || row.original.ownerIds.length === 0"
							class="text-muted"
							>-</span
						>

						<div
							v-else-if="getOwners(row.original).length === 1"
							class="flex items-center gap-2">
							<UPopover mode="hover" :open-delay="250" :close-delay="100">
								<div class="flex items-center gap-2 cursor-pointer">
									<div class="inline-block">
										<UAvatar
											size="sm"
											:src="getOwners(row.original)[0]?.photoURL"
											:text="getOwnerInitials(getOwners(row.original)[0]?.displayName)"
											class="pointer-events-auto" />
									</div>
									<span class="font-medium">{{
										getOwners(row.original)[0]?.displayName
									}}</span>
								</div>
								<template #content>
									<UCard>
										<UUser
											:name="getOwners(row.original)[0]?.displayName"
											:description="getOwners(row.original)[0]?.email"
											:avatar="{
												src: getOwners(row.original)[0]?.photoURL,
												text: getOwnerInitials(getOwners(row.original)[0]?.displayName),
											}" />
									</UCard>
								</template>
							</UPopover>
						</div>

						<div v-else class="flex -space-x-2">
							<UPopover
								v-for="owner in getOwners(row.original)"
								:key="owner.uid"
								mode="hover"
								:open-delay="250"
								:close-delay="100">
								<div class="inline-block cursor-pointer">
									<UAvatar
										size="sm"
										:src="owner.photoURL"
										:text="getOwnerInitials(owner.displayName)"
										class="ring-2 ring-white pointer-events-auto" />
								</div>
								<template #content>
									<UCard>
										<UUser
											:name="owner.displayName"
											:description="owner.email"
											:avatar="{
												src: owner.photoURL,
												text: getOwnerInitials(owner.displayName),
											}" />
									</UCard>
								</template>
							</UPopover>
						</div>
					</div>
				</template>

				<template #enabled-cell="{ row }">
					<UBadge :color="row.original.enabled ? 'success' : 'neutral'" variant="subtle" size="md">
						<template #leading>
							<UIcon :name="row.original.enabled ? 'i-lucide-check-circle' : 'i-lucide-circle-off'" class="w-4 h-4" />
						</template>
						{{ row.original.enabled ? "Aktiv" : "Deaktiviert" }}
					</UBadge>
				</template>

				<template #actions-cell="{ row }">
					<UDropdownMenu :items="getHomeItems(row.original)">
						<UButton
							color="neutral"
							variant="ghost"
							icon="i-lucide-ellipsis-vertical"
							size="lg" />
					</UDropdownMenu>
				</template>
			</UTable>
		</UCard>
	</div>
</template>
