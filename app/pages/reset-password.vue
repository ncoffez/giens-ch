<template>
	<div class="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center px-4 py-16">
		<div class="w-full max-w-md">
			<div class="bg-white dark:bg-stone-800 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-700 overflow-hidden">
				<div class="p-8 text-center border-b border-stone-100 dark:border-stone-700">
					<div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
						<UIcon name="i-lucide-key-round" class="w-8 h-8 text-primary" />
					</div>
					<h1 class="text-2xl font-black">Passwort zurücksetzen</h1>
					<p class="text-stone-500 dark:text-stone-400 mt-2 text-sm">
						Gib deine E-Mail-Adresse ein, um einen Link zum Zurücksetzen zu erhalten.
					</p>
				</div>

				<form @submit.prevent="resetPassword" class="p-8 space-y-6">
					<div>
						<label class="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
							E-Mail
						</label>
						<input
							v-model="state.email"
							type="email"
							placeholder="deine@email.ch"
							class="w-full px-5 py-3 bg-stone-50 dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
						/>
					</div>

					<UButton
						type="submit"
						color="primary"
						size="xl"
						:loading="loading"
						class="w-full rounded-full"
					>
						Link senden
					</UButton>
				</form>

				<div class="px-8 pb-8 text-center">
					<NuxtLink
						to="/login"
						class="text-sm text-stone-500 dark:text-stone-400 hover:text-primary dark:hover:text-primary-400 inline-flex items-center gap-2"
					>
						<UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
						Zurück zum Login
					</NuxtLink>
				</div>
			</div>

			<p class="text-center text-xs text-stone-400 mt-6">
				Du hast noch kein Konto?
				<NuxtLink to="/register" class="text-primary hover:underline">Registrieren</NuxtLink>
			</p>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { sendPasswordResetEmail } from "firebase/auth";

const state = reactive({
	email: "",
});
const router = useRouter();
const { $auth } = useNuxtApp();
const toast = useToast();
const loading = ref(false);

async function resetPassword() {
	if (!state.email) {
		toast.add({
			color: "error",
			title: "Fehler",
			description: "Bitte gib deine E-Mail-Adresse ein.",
		});
		return;
	}

	loading.value = true;
	try {
		await sendPasswordResetEmail($auth, state.email);
		toast.add({
			color: "success",
			title: "E-Mail gesendet",
			description: "Prüfe deinen Posteingang für den Link zum Zurücksetzen deines Passworts.",
		});
		router.push("/login");
	} catch (error: unknown) {
		toast.add({
			color: "error",
			title: "Fehler",
			description: error.message || "Etwas ist schiefgelaufen.",
		});
	} finally {
		loading.value = false;
	}
}
</script>