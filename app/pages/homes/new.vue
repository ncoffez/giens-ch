<script setup lang="ts">
definePageMeta({ middleware: ["is-owner", "homes-feature"] });

const { token } = useAuthReady();
const router = useRouter();
const toast = useToast();

const houseNumber = ref<number | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const previewName = computed(() => {
	return houseNumber.value ? `Haus ${houseNumber.value}` : "Haus ?";
});

const submit = async () => {
	if (!houseNumber.value) {
		error.value = "Hausnummer ist erforderlich";
		return;
	}

	try {
		loading.value = true;
		error.value = null;

		const newHome = await $fetch("/api/homes/create", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { houseNumber: houseNumber.value },
		});

		toast.add({ title: "Haus erstellt!", description: `${previewName.value} wurde erfolgreich erstellt.`, color: "success" });
		router.push(`/homes/${newHome.id}/edit`);
	} catch (e: unknown) {
		error.value = getFetchError(e) || "Fehler beim Erstellen des Hauses";
	} finally {
		loading.value = false;
	}
};
</script>

<template>
	<div class="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center px-4">
		<div class="w-full max-w-md">
			<div class="bg-white dark:bg-stone-800 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-700 overflow-hidden">
				<div class="p-8 text-center border-b border-stone-100 dark:border-stone-700">
					<div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
						<UIcon name="i-lucide-home" class="w-8 h-8 text-primary" />
					</div>
					<h1 class="text-2xl font-black">Neues Haus erstellen</h1>
					<p class="text-stone-500 dark:text-stone-400 mt-2">Geben Sie die Hausnummer ein, um ein neues Haus anzulegen.</p>
				</div>

				<form @submit.prevent="submit" class="p-8 space-y-6">
					<div v-if="error" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-sm">
						{{ error }}
					</div>

					<div class="space-y-2">
						<label class="text-sm font-bold text-stone-700 dark:text-stone-300">Hausnummer</label>
						<div class="relative">
							<span class="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">Haus</span>
							<input
								v-model.number="houseNumber"
								type="number"
								min="1"
								max="30"
								placeholder="11"
								class="w-full pl-16 pr-4 py-4 text-2xl font-black text-center bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
							/>
						</div>
						<p class="text-xs text-stone-400 text-center mt-2">
							Angezeigter Name: <span class="font-bold text-stone-600 dark:text-stone-300">{{ previewName }}</span>
						</p>
					</div>

					<div class="flex gap-3 pt-4">
						<UButton
							type="button"
							variant="ghost"
							color="neutral"
							size="xl"
							class="flex-1 rounded-full"
							@click="router.push('/homes')"
						>
							Abbrechen
						</UButton>
						<UButton
							type="submit"
							color="primary"
							size="xl"
							:loading="loading"
							class="flex-1 rounded-full"
						>
							Erstellen
						</UButton>
					</div>
				</form>
			</div>

			<p class="text-center text-xs text-stone-400 mt-6">
				Nach dem Erstellen können Sie Fotos, Anweisungen und weitere Details hinzufügen.
			</p>
		</div>
	</div>
</template>