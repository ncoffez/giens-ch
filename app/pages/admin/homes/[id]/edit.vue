<script setup lang="ts">
definePageMeta({ middleware: ["is-admin"] });

const { waitForAuth, token } = useAuthReady();
const toast = useToast();
const route = useRoute();
const localePath = useLocalePath();

const homeId = computed(() => route.params.id as string);
const home = ref<any>(null);
const owners = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const ownersError = ref<string | null>(null);
const ownersLoading = ref(true);

const ownerSelectItems = computed(() =>
	owners.value.map((owner) => ({
		label: owner.displayName,
		value: owner.uid,
		avatar: { src: owner.photoURL, alt: owner.displayName },
		email: owner.email,
	})),
);

const selectedOwnerRecords = computed(() => {
	if (!home.value?.ownerIds?.length) {
		return [];
	}

	return home.value.ownerIds
		.map((uid: string) => owners.value.find((owner) => owner.uid === uid))
		.filter(Boolean);
});

const homeStatusLabel = computed(() => {
	if (!home.value) {
		return "";
	}

	return home.value.enabled ? "Aktiv" : "Deaktiviert";
});

const selectedOwnersLabel = computed(() => {
	const count = home.value?.ownerIds?.length || 0;

	if (count === 0) {
		return "Keine Eigentümer zugewiesen";
	}

	if (count === 1) {
		return "1 Eigentümer zugewiesen";
	}

	return `${count} Eigentümer zugewiesen`;
});

function normalizeHomePayload(data: any) {
	const ownerIds = Array.isArray(data?.ownerIds)
		? data.ownerIds
		: data?.ownerId
			? [data.ownerId]
			: [];

	return {
		...data,
		ownerIds,
		enabled: data?.enabled ?? true,
	};
}

const fetchOwners = async () => {
	try {
		await waitForAuth();
		ownersLoading.value = true;
		ownersError.value = null;
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
	} finally {
		ownersLoading.value = false;
	}
};

const fetchHome = async () => {
	try {
		await waitForAuth();
		loading.value = true;
		error.value = null;
		const response = await $fetch(`/api/admin/homes/${homeId.value}`, {
			headers: { Authorization: `Bearer ${token.value}` },
		});
		home.value = normalizeHomePayload(response);
	} catch (e: unknown) {
		error.value = getFetchError(e) || "Haus konnte nicht geladen werden";
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
			body: {
				...home.value,
				ownerIds: home.value.ownerIds || [],
				ownerId: home.value.ownerIds?.[0] || null,
			},
		});
		toast.add({ title: "Haus erfolgreich gespeichert", color: "success" });
		navigateTo(localePath("/admin/homes"));
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

useHead({
	title: "Haus bearbeiten",
});
</script>

<template>
	<div class="mx-auto max-w-screen-xl px-4 py-8 md:px-6">
		<div v-if="loading && !home" class="flex min-h-[280px] items-center justify-center">
			<div class="space-y-4 text-center">
				<div class="mx-auto h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
				<p class="text-sm text-[var(--app-muted)]">Hausdaten werden geladen...</p>
			</div>
		</div>

		<div
			v-else-if="error"
			class="rounded-[1.75rem] border border-red-200 bg-red-50/80 px-6 py-8 text-red-600 dark:border-red-900/70 dark:bg-red-950/30"
		>
			<p class="text-sm font-semibold uppercase tracking-[0.18em]">Fehler</p>
			<p class="mt-3 text-base">{{ error }}</p>
		</div>

		<div
			v-else-if="!home"
			class="rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50/70 px-6 py-10 text-center text-[var(--app-muted)] dark:border-stone-700 dark:bg-stone-900/40"
		>
			Haus nicht gefunden
		</div>

		<form v-else class="space-y-8" @submit.prevent="save">
			<div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div class="space-y-3">
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)]">
						Häuser verwalten
					</p>
					<div>
						<h1 class="display-copy text-4xl font-bold tracking-[-0.04em]">
							{{ home.name }} bearbeiten
						</h1>
						<p class="mt-2 max-w-2xl text-sm text-[var(--app-muted)]">
							Verwalten Sie Anzeigename, Aktivstatus und Eigentümer in einer kompakten Bearbeitungsansicht.
						</p>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[24rem]">
					<div class="rounded-2xl border border-stone-200/70 bg-stone-50/80 px-4 py-3 dark:border-stone-800 dark:bg-stone-900/50 md:border-[var(--app-border)] md:bg-[var(--app-surface)] md:shadow-[var(--app-shadow)]">
						<p class="text-xs uppercase tracking-[0.18em] text-[var(--app-muted)]">Status</p>
						<p class="mt-2 text-lg font-semibold text-[var(--app-text)]">{{ homeStatusLabel }}</p>
					</div>
					<div class="rounded-2xl border border-stone-200/70 bg-stone-50/80 px-4 py-3 dark:border-stone-800 dark:bg-stone-900/50 md:border-[var(--app-border)] md:bg-[var(--app-surface)] md:shadow-[var(--app-shadow)]">
						<p class="text-xs uppercase tracking-[0.18em] text-[var(--app-muted)]">Eigentümer</p>
						<p class="mt-2 text-lg font-semibold text-[var(--app-text)]">{{ selectedOwnersLabel }}</p>
					</div>
				</div>
			</div>

			<div class="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
				<section class="rounded-[1.75rem] border border-stone-200/80 bg-white/80 p-6 shadow-sm dark:border-stone-800 dark:bg-stone-950/80">
					<div class="mb-6 space-y-1">
						<p class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-primary)]">Grunddaten</p>
						<h2 class="text-xl font-semibold text-[var(--app-text)]">Hausdetails</h2>
					</div>

					<div class="space-y-6">
						<UFormField label="Name" required>
							<UInput v-model="home.name" placeholder="z.B. Haus 11" size="lg" class="w-full" />
							<p class="mt-1 text-xs text-[var(--app-muted)]">Der angezeigte Name des Hauses.</p>
						</UFormField>

						<div class="rounded-2xl border border-stone-200/70 bg-stone-50/80 px-4 py-4 dark:border-stone-800 dark:bg-stone-900/50">
							<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<p class="text-sm font-medium text-[var(--app-text)]">Status</p>
									<p class="mt-1 text-sm text-[var(--app-muted)]">
										Deaktivierte Häuser erscheinen nicht in aktiven Verwaltungslisten.
									</p>
								</div>
								<div class="flex items-center gap-3">
									<USwitch v-model="home.enabled" />
									<span class="text-sm font-medium text-[var(--app-text)]">{{ homeStatusLabel }}</span>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section class="rounded-[1.75rem] border border-stone-200/80 bg-white/80 p-6 shadow-sm dark:border-stone-800 dark:bg-stone-950/80">
					<div class="mb-6 space-y-1">
						<p class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-primary)]">Zuordnung</p>
						<h2 class="text-xl font-semibold text-[var(--app-text)]">Eigentümer zuweisen</h2>
					</div>

					<div class="space-y-4">
						<div
							v-if="ownersError"
							class="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/30"
						>
							{{ ownersError }}
						</div>

						<div
							v-else-if="ownersLoading"
							class="flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-stone-50/80 px-4 py-4 text-sm text-[var(--app-muted)] dark:border-stone-800 dark:bg-stone-900/50"
						>
							<div class="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
							<span>Eigentümer werden geladen...</span>
						</div>

						<div
							v-else-if="owners.length === 0"
							class="rounded-2xl border border-dashed border-stone-300 bg-stone-50/70 px-4 py-4 text-sm text-[var(--app-muted)] dark:border-stone-700 dark:bg-stone-900/40"
						>
							Keine Benutzer vorhanden.
							<NuxtLink :to="localePath('/admin/users')" class="font-medium text-primary hover:underline">
								Benutzer erstellen
							</NuxtLink>
						</div>

						<template v-else>
							<UFormField label="Eigentümer" :description="'Mehrfachauswahl möglich, falls ein Haus mehreren Personen zugeordnet werden soll.'">
								<USelect
									v-model="home.ownerIds"
									multiple
									:items="ownerSelectItems"
									value-key="value"
									placeholder="Eigentümer auswählen"
									class="w-full"
									:ui="{ content: 'min-w-80', item: 'items-center gap-2' }"
								>
									<template #item-label="{ item }">
										<div class="flex min-w-0 flex-col">
											<span class="font-medium">{{ item.label }}</span>
											<span class="text-[11px] text-[var(--app-muted)]">
												{{ item.email }}
											</span>
										</div>
									</template>
								</USelect>
							</UFormField>

							<div
								v-if="selectedOwnerRecords.length"
								class="rounded-2xl border border-stone-200/70 bg-stone-50/80 px-4 py-4 dark:border-stone-800 dark:bg-stone-900/50"
							>
								<p class="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">Aktuell zugewiesen</p>
								<div class="space-y-3">
									<div
										v-for="owner in selectedOwnerRecords"
										:key="owner.uid"
										class="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-stone-950/80"
									>
										<UAvatar
											size="md"
											:src="owner.photoURL"
											:text="owner.displayName"
										/>
										<div class="min-w-0">
											<p class="truncate font-medium text-[var(--app-text)]">{{ owner.displayName }}</p>
											<p class="truncate text-sm text-[var(--app-muted)]">{{ owner.email }}</p>
										</div>
									</div>
								</div>
							</div>
						</template>
					</div>
				</section>
			</div>

			<div class="flex flex-col gap-3 border-t border-[var(--app-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
				<p class="text-sm text-[var(--app-muted)]">
					Änderungen werden sofort für Verwaltung und Zuordnung dieses Hauses übernommen.
				</p>
				<div class="flex gap-3">
					<NuxtLink :to="localePath('/admin/homes')">
						<UButton variant="ghost" color="neutral">Abbrechen</UButton>
					</NuxtLink>
					<UButton type="submit" :loading="loading" icon="i-lucide-save">
						Speichern
					</UButton>
				</div>
			</div>
		</form>
	</div>
</template>
