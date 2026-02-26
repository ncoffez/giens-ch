<script setup lang="ts">
import type { GlobalSettings } from "~/types";
import { useDebounceFn } from "@vueuse/core";

definePageMeta({ middleware: ["is-admin"] });

const { $currentUser } = useNuxtApp();
const { token } = useAuthReady();
const toast = useToast();
const { clearUserPreferenceCache, fetchUserPreference } = useFeatureFlags();

const globalSettings = ref<GlobalSettings>({
	id: "",
	maxHomeNumber: 30,
	washingMachineUse: "",
	homesFeatureGloballyEnabled: false,
	updatedAt: "",
});

const personalSettings = ref({
	homesFeatureEnabled: false,
});

const loading = ref(false);
const savingGlobal = ref(false);
const savingPersonal = ref(false);
const error = ref<string | null>(null);
const isInitialized = ref(false);

	const fetchSettings = async () => {
	try {
		loading.value = true;
		error.value = null;

		const [globalData, userData] = await Promise.all([
			$fetch<GlobalSettings>("/api/settings"),
			$currentUser?.value?.uid
				? $fetch<{ homesFeatureEnabled?: boolean }>(`/api/profile/${$currentUser.value.uid}`, {
						headers: { Authorization: `Bearer ${token.value}` },
					})
				: null,
		]);

		globalSettings.value = globalData;
		if (userData) {
			personalSettings.value.homesFeatureEnabled = userData.homesFeatureEnabled ?? false;
		}
		isInitialized.value = true;
	} catch (e: unknown) {
		error.value = getFetchError(e) || "Failed to load settings";
	} finally {
		loading.value = false;
	}
};

const saveGlobalSettings = async () => {
	try {
		savingGlobal.value = true;
		await $fetch("/api/settings.update", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: {
				maxHomeNumber: globalSettings.value.maxHomeNumber,
				washingMachineUse: globalSettings.value.washingMachineUse,
				homesFeatureGloballyEnabled: globalSettings.value.homesFeatureGloballyEnabled,
			},
		});
		toast.add({ title: "Globale Einstellungen gespeichert", color: "success" });
	} catch (e: unknown) {
		toast.add({ title: getFetchError(e) || "Fehler beim Speichern", color: "error" });
	} finally {
		savingGlobal.value = false;
	}
};

const savePersonalSettings = async () => {
	try {
		savingPersonal.value = true;
		await $fetch("/api/profile/preferences", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: {
				homesFeatureEnabled: personalSettings.value.homesFeatureEnabled,
			},
		});
		clearUserPreferenceCache();
		await fetchUserPreference();
		toast.add({ title: "Persönliche Einstellungen gespeichert", color: "success" });
	} catch (e: unknown) {
		toast.add({ title: getFetchError(e) || "Fehler beim Speichern", color: "error" });
	} finally {
		savingPersonal.value = false;
	}
};

const debouncedSavePersonal = useDebounceFn(savePersonalSettings, 300);

watch(() => personalSettings.value.homesFeatureEnabled, () => {
	if (isInitialized.value) {
		debouncedSavePersonal();
	}
});

onMounted(fetchSettings);
</script>

<template>
	<div class="max-w-screen-lg mx-auto px-4 py-8">
		<h1 class="text-3xl font-bold mb-8">Admin Einstellungen</h1>

		<div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
			{{ error }}
		</div>

		<div v-if="loading" class="flex items-center justify-center py-12">
			<div class="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
		</div>

		<div v-else class="space-y-8">
			<UCard>
				<template #header>
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
							<UIcon name="i-lucide-user" class="w-5 h-5 text-primary" />
						</div>
						<div>
							<h2 class="text-lg font-semibold">Persönliche Einstellungen</h2>
							<p class="text-sm text-stone-500">Nur für Sie sichtbar</p>
						</div>
					</div>
				</template>

				<div class="space-y-6">
					<div class="flex items-start justify-between gap-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50">
						<div class="flex items-start gap-3">
							<UIcon name="i-lucide-home" class="w-5 h-5 text-stone-400 mt-0.5" />
							<div>
								<p class="font-medium">Mein Haus</p>
								<p class="text-sm text-stone-500 mt-0.5">
									Zeigt Ihnen den Bereich "Mein Haus" im Menü an. Andere Benutzer sehen diesen nicht.
								</p>
							</div>
						</div>
						<USwitch v-model="personalSettings.homesFeatureEnabled" :loading="savingPersonal" />
					</div>
				</div>
			</UCard>

			<UCard>
				<template #header>
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
							<UIcon name="i-lucide-settings" class="w-5 h-5 text-stone-500" />
						</div>
						<div>
							<h2 class="text-lg font-semibold">Globale Einstellungen</h2>
							<p class="text-sm text-stone-500">Für alle Benutzer gültig</p>
						</div>
					</div>
				</template>

				<form @submit.prevent="saveGlobalSettings" class="space-y-6">
					<UFormField
						label="Maximale Hausnummer"
						description="Die höchste erlaubte Hausnummer (z.B. 30 für Häuser 1-30)"
					>
						<UInput
							v-model.number="globalSettings.maxHomeNumber"
							type="number"
							min="1"
						/>
					</UFormField>

					<UFormField
						label="Standard Waschmaschinen-Anleitung"
						description="Diese Anleitung gilt für alle Häuser, sofern nicht überschrieben"
					>
						<UTextarea
							v-model="globalSettings.washingMachineUse"
							placeholder="Waschmaschinen-Anleitung eingeben..."
							:rows="6"
						/>
					</UFormField>

					<USeparator />

					<div class="space-y-4">
						<h3 class="text-sm font-semibold text-stone-500 uppercase tracking-wide">Feature Flags</h3>
						<div class="flex items-start justify-between gap-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50">
							<div class="flex items-start gap-3">
								<UIcon name="i-lucide-globe" class="w-5 h-5 text-stone-400 mt-0.5" />
								<div>
									<p class="font-medium">Häuser-Feature global aktivieren</p>
									<p class="text-sm text-stone-500 mt-0.5">
										Macht "Mein Haus" für alle Benutzer sichtbar. Noch nicht empfohlen – das Feature ist noch in Entwicklung.
									</p>
								</div>
							</div>
							<USwitch v-model="globalSettings.homesFeatureGloballyEnabled" />
						</div>
					</div>

					<div class="flex justify-end">
						<UButton type="submit" :loading="savingGlobal">
							Speichern
						</UButton>
					</div>
				</form>
			</UCard>
		</div>
	</div>
</template>