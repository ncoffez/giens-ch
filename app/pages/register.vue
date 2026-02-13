<template>
	<section
		class="relative overflow-hidden flex flex-col items-center p-8 border-neutral-200 bg-white dark:bg-neutral-800 shadow-lg rounded-3xl my-16 mx-auto w-fit">
		<h3 class="font-bold text-2xl mb-4 text-neutral-800 dark:text-neutral-200">Registrieren</h3>
		<p class="text-sm text-stone-500 dark:text-stone-400 mb-6 text-center max-w-xs">
			Erstellen Sie ein Konto, um auf alle Funktionen zuzugreifen.
		</p>
		<UForm :state="state" class="flex flex-col gap-2 min-w-72">
			<UiInput type="text" label="Name" v-model="state.name"></UiInput>
			<UiInput type="email" label="E-Mail" v-model="state.email"></UiInput>
			<UiInput type="password" label="Passwort" v-model="state.password"></UiInput>
			<UiInput type="password" label="Passwort bestätigen" v-model="state.confirmPassword"></UiInput>
			<UButton
				type="submit"
				@click="register"
				class="justify-center text-white font-semibold w-full"
				:loading="loading">
				Registrieren
			</UButton>
		</UForm>
		<NuxtLink
			to="/login"
			class="text-sm mt-4 text-stone-500 dark:text-stone-400 hover:text-primary-600 dark:hover:text-primary-400">
			Bereits ein Konto? Anmelden
		</NuxtLink>
	</section>
</template>

<script lang="ts" setup>
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

const state = reactive({
	name: "",
	email: "",
	password: "",
	confirmPassword: "",
});
const router = useRouter();
const { $auth } = useNuxtApp();
const toast = useToast();
const loading = ref(false);

function validateForm() {
	if (!state.name || !state.email || !state.password || !state.confirmPassword) {
		toast.add({
			color: "error",
			title: "Fehler",
			description: "Bitte alle Felder ausfüllen.",
		});
		return false;
	}

	if (state.name.trim().length < 2) {
		toast.add({
			color: "error",
			title: "Fehler",
			description: "Der Name muss mindestens 2 Zeichen lang sein.",
		});
		return false;
	}

	if (state.password.length < 6) {
		toast.add({
			color: "error",
			title: "Fehler",
			description: "Das Passwort muss mindestens 6 Zeichen lang sein.",
		});
		return false;
	}

	if (state.password !== state.confirmPassword) {
		toast.add({
			color: "error",
			title: "Fehler",
			description: "Die Passwörter stimmen nicht überein.",
		});
		return false;
	}

	return true;
}

async function register() {
	if (!validateForm()) return;

	loading.value = true;
	try {
		const userCredential = await createUserWithEmailAndPassword($auth, state.email, state.password);
		await updateProfile(userCredential.user, { displayName: state.name.trim() });
		toast.add({
			color: "success",
			title: "Erfolg",
			description: "Konto erfolgreich erstellt.",
		});
		router.push("/profile");
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