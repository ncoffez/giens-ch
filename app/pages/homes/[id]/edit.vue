<script setup lang="ts">
const { $token, $currentUser, $isAdmin } = useNuxtApp();
const route = useRoute();
const toast = useToast();

const homeId = computed(() => route.params.id as string);
const home = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const activeTab = ref("basic");

const fetchHome = async () => {
	try {
		loading.value = true;
		error.value = null;
		home.value = await $fetch(`/api/homes/${homeId.value}`, {
			headers: { Authorization: `Bearer ${$token.value}` },
		});
	} catch (e: any) {
		error.value = e.data?.message || e.message || "Failed to load home";
	} finally {
		loading.value = false;
	}
};

const deleteHome = async () => {
	if (!confirm("Are you sure you want to delete this home?")) return;

	try {
		await $fetch(`/api/homes/${homeId.value}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
		});

		toast.add({ title: "Home deleted successfully", color: "green" });
		navigateTo("/homes");
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Failed to delete home", color: "red" });
	}
};

const canDelete = computed(() => {
	return $isAdmin.value || ($currentUser.value && home.value?.ownerId === $currentUser.value.uid);
});

onMounted(fetchHome);
watch(homeId, fetchHome);
</script>

<template>
	<div class="max-w-screen-2xl mx-auto px-4 py-8">
		<div v-if="loading" class="text-center py-8">Loading...</div>

		<div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>

		<div v-else-if="!home" class="text-center py-8">Home not found</div>

		<div v-else class="space-y-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold">Home {{ home.name }}</h1>
					<p class="text-sm text-gray-500">
						Owner · ID: {{ home.id.slice(0, 8) }}...
					</p>
				</div>
				<div class="flex gap-2">
					<UButton color="red" variant="ghost" :disabled="!canDelete" @click="deleteHome">
						<UIcon name="i-lucide-trash-2" />
					</UButton>
				</div>
			</div>

			<UTabs v-model="activeTab" :items="[
				{ label: 'Basic Info', value: 'basic' },
				{ label: 'Photos', value: 'photos' },
				{ label: 'Instructions', value: 'instructions' },
				{ label: 'Rules & Info', value: 'rules' },
				{ label: 'Sharing', value: 'sharing' },
			]">
				<template #basic>
					<BasicInfoEditor :home="home" @refresh="fetchHome" />
				</template>

				<template #photos>
					<PhotoGallery :home="home" @refresh="fetchHome" />
				</template>

				<template #instructions>
					<InstructionsEditor :home="home" @refresh="fetchHome" />
				</template>

				<template #rules>
					<RulesEditor :home="home" @refresh="fetchHome" />
				</template>

				<template #sharing>
					<SharingPanel :home="home" />
				</template>
			</UTabs>
		</div>
	</div>
</template>