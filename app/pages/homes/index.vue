<script setup lang="ts">
definePageMeta({ middleware: ["is-owner"] });

const { $currentUser } = useNuxtApp();
const { waitForAuth, token } = useAuthReady();
const homes = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchHomes = async () => {
	try {
		await waitForAuth();
		loading.value = true;
		error.value = null;
		homes.value = await $fetch("/api/homes", {
			headers: { Authorization: `Bearer ${token.value}` },
		});

		// Redirect logic
		if (homes.value.length === 0) {
			return navigateTo("/homes/new");
		} else if (homes.value.length === 1) {
			return navigateTo(`/homes/${homes.value[0].id}`);
		}
	} catch (e: any) {
		error.value = e.message || "Failed to load homes";
	} finally {
		loading.value = false;
	}
};

onMounted(fetchHomes);
</script>

<template>
	<div class="max-w-screen-2xl mx-auto px-4 py-8">
		<div class="flex items-center justify-between mb-8">
			<h1 class="text-3xl font-bold">My Homes</h1>
		</div>

		<div v-if="loading" class="text-center py-8">Loading...</div>

		<div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>

		<div v-else-if="homes.length === 0" class="text-center py-8 text-stone-500">
			<p>You haven't created any homes yet.</p>
			<p class="mt-2">Click "Create New Home" to get started.</p>
		</div>

		<div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<NuxtLink
				v-for="home in homes"
				:key="home.id"
				:to="`/homes/${home.id}/edit`"
				class="block"
			>
				<UCard>
					<template #header>
						<h2 class="text-xl font-bold">Home {{ home.name }}</h2>
						<p class="text-sm text-stone-500">
							Created: {{ new Date(home.createdAt).toLocaleDateString() }}
						</p>
					</template>
					<p class="text-sm text-stone-600 mb-4">
						{{ home.photos?.length || 0 }} photos · {{ home.editors?.length || 0 }} editors
					</p>
					<UButton variant="ghost" color="neutral" block>
						Manage Home <UIcon name="i-lucide-arrow-right" class="ml-2" />
					</UButton>
				</UCard>
			</NuxtLink>
		</div>
	</div>
</template>