<script setup lang="ts">
const { $token, $currentUser, $isAdmin } = useNuxtApp();
const route = useRoute();
const toast = useToast();

const homeId = computed(() => route.params.id as string);
const home = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

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

const canEdit = computed(() => {
	if ($isAdmin.value || !$currentUser.value || !home.value) return false;
	return home.value?.ownerIds?.includes($currentUser.value.uid) || home.value?.editors?.includes($currentUser.value.uid) || $isAdmin.value;
});

onMounted(fetchHome);
watch(homeId, fetchHome);
</script>

<template>
	<div class="max-w-screen-2xl mx-auto px-4 py-8">
		<div v-if="loading" class="text-center py-8">Loading...</div>

		<div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>

		<div v-else-if="!home" class="text-center py-8">Home not found</div>

		<div v-else class="space-y-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold">Home {{ home.name }}</h1>
					<p class="text-sm text-gray-500">
						Created: {{ new Date(home.createdAt).toLocaleDateString() }} · 
						Updated: {{ new Date(home.updatedAt).toLocaleDateString() }}
					</p>
				</div>
				<NuxtLink v-if="canEdit" :to="`/homes/${home.id}/edit`">
					<UButton color="primary">
						<UIcon name="i-lucide-edit-3" class="mr-2" />
						Edit
					</UButton>
				</NuxtLink>
			</div>

			<UCard v-if="home.photos && home.photos.length > 0">
				<h2 class="text-xl font-semibold mb-4">Photos</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<img
						v-for="(photo, idx) in home.photos"
						:key="idx"
						:src="photo"
						:alt="`Photo ${idx + 1}`"
						class="rounded-lg w-full h-48 object-cover"
					/>
				</div>
			</UCard>

			<UCard>
				<h2 class="text-xl font-semibold mb-4">Basic Information</h2>
				<div class="space-y-3">
					<div v-if="home.contact?.name">
						<p class="text-sm text-gray-500">Contact Person</p>
						<p class="font-medium">{{ home.contact.name }}</p>
					</div>
					<div v-if="home.contact?.phone">
						<p class="text-sm text-gray-500">Phone</p>
						<p class="font-medium">{{ home.contact.phone }}</p>
					</div>
					<div v-if="home.contact?.email">
						<p class="text-sm text-gray-500">Email</p>
						<p class="font-medium">{{ home.contact.email }}</p>
					</div>
					<div v-if="home.wifiPassword">
						<p class="text-sm text-gray-500">WiFi Password</p>
						<p class="font-medium">{{ home.wifiPassword }}</p>
					</div>
					<div v-if="home.parkingNumber">
						<p class="text-sm text-gray-500">Parking Spot</p>
						<p class="font-medium">{{ home.parkingNumber }}</p>
					</div>
				</div>
			</UCard>

			<UCard>
				<h2 class="text-xl font-semibold mb-4">Check-in Instructions</h2>
				<p class="whitespace-pre-wrap">{{ home.checkInInfo || "No information available" }}</p>
			</UCard>

			<UCard>
				<h2 class="text-xl font-semibold mb-4">Check-out Instructions</h2>
				<p class="whitespace-pre-wrap">{{ home.checkOutInfo || "No information available" }}</p>
			</UCard>

			<UCard>
				<h2 class="text-xl font-semibold mb-4">House Rules</h2>
				<p class="whitespace-pre-wrap">{{ home.houseRules || "No rules specified" }}</p>
			</UCard>

			<UCard v-if="home.mustKnows && home.mustKnows.length > 0">
				<h2 class="text-xl font-semibold mb-4">Important Notes</h2>
				<ul class="list-disc list-inside space-y-1">
					<li v-for="(note, idx) in home.mustKnows" :key="idx">{{ note }}</li>
				</ul>
			</UCard>

			<UCard>
				<h2 class="text-xl font-semibold mb-4">Blankets Information</h2>
				<p class="whitespace-pre-wrap">{{ home.blanketsInfo || "No information available" }}</p>
			</UCard>

			<UCard v-if="home.cleaningInfo && home.cleaningInfo.length > 0">
				<h2 class="text-xl font-semibold mb-4">Cleaning Instructions</h2>
				<ul class="list-disc list-inside space-y-1">
					<li v-for="(instruction, idx) in home.cleaningInfo" :key="idx">{{ instruction }}</li>
				</ul>
			</UCard>

			<UCard v-if="home.washingMachineOverride">
				<h2 class="text-xl font-semibold mb-4">Washing Machine</h2>
				<p class="whitespace-pre-wrap">{{ home.washingMachineOverride }}</p>
			</UCard>
		</div>
	</div>
</template>