<script setup lang="ts">
const { $token } = useNuxtApp();
const route = useRoute();

const shareId = computed(() => route.params.shareId as string);
const home = ref<any>(null);
const share = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchHome = async () => {
	try {
		loading.value = true;
		const result = await $fetch(`/api/homes/view/${shareId.value}`, {
			headers: { Authorization: `Bearer ${$token.value}` },
		});
		home.value = result.home;
		share.value = result.share;
	} catch (e: any) {
		error.value = e.data?.message || e.message || "Failed to load home";
	} finally {
		loading.value = false;
	}
};

onMounted(fetchHome);
</script>

<template>
	<div class="max-w-screen-2xl mx-auto">
		<div v-if="loading" class="text-center py-8">Loading...</div>

		<div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>

		<div v-else-if="!home" class="text-center py-8">Home not found</div>

		<div v-else class="space-y-8 px-4 py-8">
			<UCard>
				<template #header>
					<h1 class="text-3xl font-bold">Welcome to Home {{ home.name }}</h1>
				</template>

				<!-- Photo Gallery -->
				<div v-if="home.photos?.length" class="mb-8">
					<h2 class="text-xl font-semibold mb-4">Photos</h2>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
						<img
							v-for="(photo, index) in home.photos"
							:key="index"
							:src="photo"
							:alt="`Home photo ${index + 1}`"
							class="w-full aspect-square object-cover rounded-lg"
						/>
					</div>
				</div>

				<!-- Contact Information -->
				<div v-if="home.contact" class="mb-8">
					<h2 class="text-xl font-semibold mb-4">Contact Information</h2>
					<div class="space-y-2">
						<p v-if="home.contact.name"><strong>Owner:</strong> {{ home.contact.name }}</p>
						<p v-if="home.contact.phone"><strong>Phone:</strong> <a :href="`tel:${home.contact.phone}`" class="text-blue-600">{{ home.contact.phone }}</a></p>
						<p v-if="home.contact.email"><strong>Email:</strong> <a :href="`mailto:${home.contact.email}`" class="text-blue-600">{{ home.contact.email }}</a></p>
					</div>
				</div>

				<!-- WiFi -->
				<div v-if="home.wifiPassword" class="mb-8 p-4 bg-green-50 border border-green-200 rounded">
					<h2 class="text-xl font-semibold mb-2">WiFi</h2>
					<p class="font-mono">{{ home.wifiPassword }}</p>
				</div>

				<!-- Parking -->
				<div v-if="home.parkingNumber" class="mb-8">
					<h2 class="text-xl font-semibold mb-4">Parking</h2>
					<p>Parking Spot: <strong>{{ home.parkingNumber }}</strong></p>
				</div>

				<!-- Check-in -->
				<div v-if="home.checkInInfo" class="mb-8">
					<h2 class="text-xl font-semibold mb-4">Check-in Information</h2>
					<div class="prose max-w-none" v-html="home.checkInInfo" />
				</div>

				<!-- Check-out -->
				<div v-if="home.checkOutInfo" class="mb-8">
					<h2 class="text-xl font-semibold mb-4">Check-out Information</h2>
					<div class="prose max-w-none" v-html="home.checkOutInfo" />
				</div>

				<!-- Must Knows -->
				<div v-if="home.mustKnows?.length" class="mb-8">
					<h2 class="text-xl font-semibold mb-4">Must Knows</h2>
					<ul class="list-disc pl-5 space-y-2">
						<li v-for="(item, index) in home.mustKnows" :key="index">{{ item }}</li>
					</ul>
				</div>

				<!-- Cleaning Info -->
				<div v-if="home.cleaningInfo?.length" class="mb-8">
					<h2 class="text-xl font-semibold mb-4">Cleaning Information</h2>
					<ul class="list-disc pl-5 space-y-2">
						<li v-for="(item, index) in home.cleaningInfo" :key="index">{{ item }}</li>
					</ul>
				</div>

				<!-- House Rules -->
				<div v-if="home.houseRules" class="mb-8">
					<h2 class="text-xl font-semibold mb-4">House Rules</h2>
					<div class="prose max-w-none" v-html="home.houseRules" />
				</div>

				<!-- Blankets Info -->
				<div v-if="home.blanketsInfo" class="mb-8">
					<h2 class="text-xl font-semibold mb-4">Blankets & Bedding</h2>
					<div class="prose max-w-none" v-html="home.blanketsInfo" />
				</div>

				<!-- Washing Machine -->
				<div class="mb-8">
					<h2 class="text-xl font-semibold mb-4">Washing Machine</h2>
					<div v-if="home.washingMachineOverride" class="prose max-w-none" v-html="home.washingMachineOverride" />
					<div v-else class="text-gray-500">Please contact owner for washing machine instructions.</div>
				</div>
			</UCard>
		</div>
	</div>
</template>