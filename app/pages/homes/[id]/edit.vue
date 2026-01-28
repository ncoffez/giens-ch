<script setup lang="ts">
const { $token, $currentUser, $isAdmin } = useNuxtApp();
const route = useRoute();
const toast = useToast();

const homeId = computed(() => route.params.id as string);
const home = ref<any>(null);
const owners = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const activeTab = ref("basic");

const ownerMap = computed(() => {
	const map = new Map<string, any>();
	owners.value.forEach((o) => map.set(o.uid, o));
	return map;
});

const getOwners = (ownerIds: string[]) => {
	return (ownerIds || []).map((uid) => ownerMap.value.get(uid)).filter(Boolean);
};

const getOwnerInitials = (displayName: string) => {
	return displayName
		?.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2) || "??";
};

const fetchHome = async () => {
	try {
		loading.value = true;
		error.value = null;
		const [homeData, ownersData] = await Promise.all([
			$fetch(`/api/homes/${homeId.value}`, {
				headers: { Authorization: `Bearer ${$token.value}` },
			}),
			$fetch("/api/users/owners", {
				headers: { Authorization: `Bearer ${$token.value}` },
			})
		]);
		home.value = homeData;
		owners.value = ownersData as any[];
	} catch (e: any) {
		error.value = e.data?.message || e.message || "Fehler beim Laden des Hauses";
	} finally {
		loading.value = false;
	}
};

const deleteHome = async () => {
	if (!confirm("Sind Sie sicher, dass Sie dieses Haus löschen möchten?")) return;

	try {
		await $fetch(`/api/homes/${homeId.value}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
		});

		toast.add({ title: "Haus erfolgreich gelöscht", color: "success" });
		navigateTo("/homes");
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Fehler beim Löschen", color: "error" });
	}
};

const canDelete = computed(() => {
	return $isAdmin.value || ($currentUser.value && home.value?.ownerIds?.includes($currentUser.value.uid));
});

onMounted(fetchHome);
watch(homeId, fetchHome);
</script>

<template>
	<div class="max-w-screen-xl mx-auto px-4 py-8">
		<div v-if="loading" class="text-center py-12">
			<UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin mx-auto text-primary" />
			<p class="mt-2 text-gray-500">Haus wird geladen...</p>
		</div>

		<div v-else-if="error" class="text-center py-12">
			<UIcon name="i-lucide-alert-circle" class="w-12 h-12 mx-auto text-red-500 mb-4" />
			<p class="text-red-500 font-medium">{{ error }}</p>
			<UButton color="neutral" variant="ghost" class="mt-4" @click="fetchHome">Erneut versuchen</UButton>
		</div>

		<div v-else-if="!home" class="text-center py-12 text-gray-500">Haus nicht gefunden</div>

		<div v-else class="space-y-8">
			<!-- Header -->
			<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
				<div class="space-y-4">
					<div class="flex items-center gap-3">
						<NuxtLink to="/homes" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
							<UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
						</NuxtLink>
						<h1 class="text-4xl font-black tracking-tight">Haus {{ home.name }}</h1>
					</div>
					
					<!-- Owners Display -->
					<div class="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl w-fit border border-gray-100 dark:border-gray-800 shadow-sm">
						<span class="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Eigentümer</span>
						<div class="flex -space-x-2">
							<UPopover
								v-for="owner in getOwners(home.ownerIds)"
								:key="owner.uid"
								mode="hover"
								:open-delay="200"
								:close-delay="100"
							>
								<div class="inline-block cursor-pointer">
									<UAvatar
										size="md"
										:src="owner.photoURL"
										:text="getOwnerInitials(owner.displayName)"
										class="ring-2 ring-white dark:ring-gray-900 shadow-sm hover:scale-110 transition-transform"
									/>
								</div>
								<template #content>
									<UCard class="w-64">
										<UUser
											:name="owner.displayName"
											:description="owner.email"
											:avatar="{
												src: owner.photoURL,
												text: getOwnerInitials(owner.displayName),
											}"
										/>
									</UCard>
								</template>
							</UPopover>
						</div>
					</div>
				</div>

				<div class="flex gap-2">
					<UButton color="error" variant="soft" :disabled="!canDelete" @click="deleteHome" icon="i-lucide-trash-2">
						Haus löschen
					</UButton>
				</div>
			</div>

			<UTabs v-model="activeTab" class="w-full">
				<UTabsList class="bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl mb-6">
					<UTabsTrigger value="basic">Grundinformationen</UTabsTrigger>
					<UTabsTrigger value="photos">Fotos</UTabsTrigger>
					<UTabsTrigger value="instructions">An-/Abreise</UTabsTrigger>
					<UTabsTrigger value="rules">Regeln & Info</UTabsTrigger>
					<UTabsTrigger value="sharing">Freigabe</UTabsTrigger>
				</UTabsList>

				<UTabsContent value="basic" class="focus:outline-none">
					<BasicInfoEditor :home="home" @refresh="fetchHome" />
				</UTabsContent>
				<UTabsContent value="photos" class="focus:outline-none">
					<PhotoGallery :home="home" @refresh="fetchHome" />
				</UTabsContent>
				<UTabsContent value="instructions" class="focus:outline-none">
					<InstructionsEditor :home="home" @refresh="fetchHome" />
				</UTabsContent>
				<UTabsContent value="rules" class="focus:outline-none">
					<RulesEditor :home="home" @refresh="fetchHome" />
				</UTabsContent>
				<UTabsContent value="sharing" class="focus:outline-none">
					<SharingPanel :home="home" />
				</UTabsContent>
			</UTabs>
		</div>
	</div>
</template>
