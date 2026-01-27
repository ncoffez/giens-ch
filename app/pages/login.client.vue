<template>
	<section
		class="relative overflow-hidden flex flex-col items-center p-8 border-neutral-200 bg-white dark:bg-neutral-800 shadow-lg rounded-3xl my-16 mx-auto w-fit">
		<h3 class="font-bold text-2xl mb-4 text-neutral-800 dark:text-neutral-200">Anmelden</h3>
		<UForm :state="state" class="flex flex-col gap-2 min-w-72">
			<UiInput type="email" label="E-Mail" v-model="state.email"></UiInput>
			<UiInput type="password" label="Passwort" v-model="state.password"></UiInput>
			<NuxtLink to="/reset-password" class="text-right text-xs leading-relaxed mb-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">Passwort vergessen?</NuxtLink>
			<UButton
				type="submit"
				@click="loginToFirebase('password', state.email, state.password)"
				class="justify-center text-white font-semibold w-full"
				loading-auto
				>Anmelden</UButton
			>
		</UForm>
		<div id="login-social" class="text-sm mt-4 text-gray-500 dark:text-gray-400">Oder mit Social-Media anmelden</div>
		<div class="flex gap-4 my-6">
			<button @click.prevent="loginToFirebase('google')" aria-label="Anmelden mit Google" class="hover:scale-110 transition-transform">
				<UIcon name="fa-brands:google" class="size-6" />
			</button>
			<button @click.prevent="loginWithApple" aria-label="Anmelden mit Apple" class="hover:scale-110 transition-transform">
				<UIcon name="fa-brands:apple" class="size-6" />
			</button>
		</div>
		<div class="text-xs text-gray-500 dark:text-gray-400">Noch kein Konto? <NuxtLink to="/register" class="underline hover:text-primary-600 dark:hover:text-primary-400">Registrieren</NuxtLink></div>
	</section>
</template>
<script lang="ts" setup>
import { GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";

const state = reactive({
	email: "",
	password: "",
});
const router = useRouter();
const { $currentUser } = useNuxtApp();
const toast = useToast();

definePageMeta({
	middleware: "is-not-logged-in",
});

watch($currentUser, (user) => {
	if (user.uid) router.push("/profile");
});

async function loginToFirebase(method: "google" | "password", email?: string, password?: string) {
	try {
		if (method === "google") {
			await loginWithGoogle();
		} else if (method === "password" && (!password || !email)) {
			toast.add({ color: "error", title: "Fehler", description: "E-Mail und Passwort sind erforderlich." });
		} else if (method === "password" && password && email) {
			await loginWithPassword(email, password);
		}
	} catch (e: any) {
		toast.add({ color: "error", title: "Fehler", description: e?.message || "Ein Fehler ist aufgetreten." });
	}
}

async function loginWithGoogle() {
	const { $auth } = useNuxtApp();
	const provider = new GoogleAuthProvider();
	provider.addScope("email");
	provider.addScope("profile");
	try {
		await signInWithPopup($auth, provider);
		toast.add({ color: "success", title: "Erfolg", description: "Sie haben sich erfolgreich angemeldet." });
	} catch (e: any) {
		throw new Error(e?.message || "Ein Fehler ist aufgetreten.");
	}
}

async function loginWithApple() {
	const { $auth } = useNuxtApp();
	const provider = new OAuthProvider("apple.com");
	provider.addScope("email");
	provider.addScope("name");
	try {
		await signInWithPopup($auth, provider);
		toast.add({ color: "success", title: "Erfolg", description: "Sie haben sich erfolgreich angemeldet." });
	} catch (e: any) {
		throw new Error(e?.message || "Ein Fehler ist aufgetreten.");
	}
}

async function loginWithPassword(email: string, password: string) {
	const { $auth } = useNuxtApp();
	if (!email || !password) throw new Error("Email and password are required for password login.");
	try {
		const { user } = await signInWithEmailAndPassword($auth, email, password);
		if (!user.emailVerified) {
			toast.add({ color: "warning", title: "Warnung", description: "Bitte verifizieren Sie Ihre E-Mail-Adresse." });
		}
	} catch (e: any) {
		throw new Error(e?.message || "Ein Fehler ist aufgetreten.");
	}
}
</script>
<style scoped></style>
