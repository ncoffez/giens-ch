<template>
	<section
		class="relative overflow-hidden flex flex-col items-center p-8 border-neutral-200 bg-white dark:bg-neutral-800 shadow-lg rounded-3xl my-16 mx-auto w-fit">
		<h3 class="font-bold text-2xl mb-4 text-neutral-800 dark:text-neutral-200">Passwort zurücksetzen</h3>
		<p class="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-xs">
			Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen Ihres Passworts zu erhalten.
		</p>
		<UForm :state="state" class="flex flex-col gap-2 min-w-72">
			<UiInput type="email" label="E-Mail" v-model="state.email"></UiInput>
			<UButton
				type="submit"
				@click="resetPassword"
				class="justify-center text-white font-semibold w-full"
				:loading="loading">
				Link senden
			</UButton>
		</UForm>
		<NuxtLink
			to="/login"
			class="text-sm mt-4 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
			Zurück zum Login
		</NuxtLink>
	</section>
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
			description: "Bitte geben Sie Ihre E-Mail-Adresse ein.",
		});
		return;
	}

	loading.value = true;
	try {
		await sendPasswordResetEmail($auth, state.email);
		toast.add({
			color: "success",
			title: "E-Mail gesendet",
			description: "Prüfen Sie Ihren Posteingang für den Link zum Zurücksetzen Ihres Passworts.",
		});
		router.push("/login");
	} catch (error: any) {
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

<style scoped></style>