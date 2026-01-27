<script setup lang="ts">
definePageMeta({ middleware: ["is-admin"] });

const { $token } = useNuxtApp();
const toast = useToast();
const route = useRoute();

const homeId = computed(() => route.params.id as string);
const home = ref<any>(null);
const owners = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchOwners = async () => {
	try {
		owners.value = await $fetch("/api/users/owners", {
			headers: { Authorization: `Bearer ${$token.value}` },
		});
	} catch (e: any) {
		console.error("Failed to load owners:", e);
	}
};

const fetchHome = async () => {
	try {
		loading.value = true;
		error.value = null;
		home.value = await $fetch(`/api/admin/homes/${homeId.value}`, {
			headers: { Authorization: `Bearer ${$token.value}` },
		});
	} catch (e: any) {
		error.value = e.data?.message || e.message || "Failed to load home";
	} finally {
		loading.value = false;
	}
};

const save = async () => {
	try {
		loading.value = true;
		error.value = null;
		await $fetch(`/api/admin/homes/${homeId.value}/update`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: home.value,
		});
		toast.add({ title: "Home saved successfully", color: "green" });
		await fetchHome();
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Failed to save home", color: "red" });
	} finally {
		loading.value = false;
	}
};

onMounted(() => {
		fetchHome();
		fetchOwners();
	});
watch(homeId, fetchHome);
</script>

<template>
	<div class="max-w-screen-lg mx-auto px-4 py-8">
		<div v-if="loading && !home" class="text-center py-8">Loading...</div>

		<div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>

		<div v-else-if="!home" class="text-center py-8">Home not found</div>

		<UCard v-else>
			<form @submit.prevent="save" class="space-y-6">
				<div>
					<h1 class="text-3xl font-bold mb-6">{{ home.name }} bearbeiten</h1>
				</div>

				<UFormGroup label="Status">
					<div class="flex items-center gap-4">
						<USwitch v-model="home.enabled" />
						<span>{{ home.enabled ? "Aktiv" : "Deaktiviert" }}</span>
					</div>
				</UFormGroup>

				<UFormGroup label="Eigentümer zuweisen">
					<USelect
						v-model="home.ownerId"
						:options="[
							{ label: '-', value: '' },
							...owners.map((o) => ({ label: `${o.displayName} (${o.email})`, value: o.uid })),
						]"
					/>
				</UFormGroup>

				<div class="flex gap-4">
					<NuxtLink to="/admin/homes">
						<UButton variant="ghost">Abbrechen</UButton>
					</NuxtLink>
					<UButton type="submit" :loading="loading">Speichern</UButton>
				</div>
			</form>
		</UCard>
	</div>
</template>