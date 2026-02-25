<script setup lang="ts">
definePageMeta({ middleware: ["is-admin"] });

const { waitForAuth, token } = useAuthReady();
const toast = useToast();
const route = useRoute();

const homeId = computed(() => route.params.id as string);
const home = ref<any>(null);
const owners = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const ownersError = ref<string | null>(null);

const fetchOwners = async () => {
	try {
		await waitForAuth();
		owners.value = await $fetch("/api/users/owners", {
			headers: { Authorization: `Bearer ${token.value}` },
		});
	} catch (e: unknown) {
		if (e?.statusCode === 403) {
			ownersError.value = "Zugriff verweigert - keine Admin-Berechtigung";
		} else if (e?.statusCode >= 500) {
			ownersError.value = "Serverfehler - bitte später erneut versuchen";
		} else {
			ownersError.value = e?.data?.message || e?.message || "Fehler beim Laden der Eigentümer";
		}
	}
};

const fetchHome = async () => {
	try {
		await waitForAuth();
		loading.value = true;
		error.value = null;
		home.value = await $fetch(`/api/admin/homes/${homeId.value}`, {
			headers: { Authorization: `Bearer ${token.value}` },
		});
	} catch (e: unknown) {
		error.value = getFetchError(e) || "Failed to load home";
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
			headers: { Authorization: `Bearer ${token.value}` },
			body: home.value,
		});
		toast.add({ title: "Haus erfolgreich gespeichert", color: "success" });
		navigateTo("/admin/homes");
	} catch (e: unknown) {
		toast.add({ title: getFetchError(e) || "Fehler beim Speichern", color: "error" });
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

				<UFormField label="Name" required>
					<UInput v-model="home.name" placeholder="z.B. Haus 11" size="lg" />
					<p class="text-xs text-stone-500 mt-1">Der angezeigte Name des Hauses</p>
				</UFormField>

				<UFormField label="Status">
					<div class="flex items-center gap-4">
						<USwitch v-model="home.enabled" />
						<span>{{ home.enabled ? "Aktiv" : "Deaktiviert" }}</span>
					</div>
				</UFormField>

				<UFormField label="Eigentümer zuweisen">
					<div v-if="ownersError" class="text-red-500 text-sm mb-2">{{ ownersError }}</div>

					<div v-else-if="owners.length === 0" class="text-sm text-stone-500 mb-2">
						Keine Benutzer vorhanden.
						<NuxtLink to="/admin/users" class="text-primary hover:underline">Benutzer erstellen</NuxtLink>
					</div>

					<USelect
						v-model="home.ownerIds"
						multiple
						:items="owners.map((o) => ({
							label: o.displayName,
							value: o.uid,
							avatar: { src: o.photoURL, alt: o.displayName },
						}))"
						value-key="value"
						placeholder="Eigentümer auswählen"
						:ui="{ content: 'min-w-72', item: 'items-center' }"
					>
						<template #item-label="{ item }">
							<div class="flex flex-col">
								<span class="font-medium">{{ item.label }}</span>
								<span class="text-muted text-[11px] whitespace-nowrap overflow-x-auto">
									{{ owners.find((o) => o.uid === item.value)?.email }}
								</span>
							</div>
						</template>
					</USelect>
				</UFormField>

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