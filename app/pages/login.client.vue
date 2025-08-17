<template>
	<section
		class="relative overflow-hidden flex flex-col items-center p-8 border-neutral-200 bg-white dark:bg-neutral-800 shadow-lg rounded-3xl my-16 mx-auto w-fit">
		<h3 class="font-bold text-2xl mb-4 text-neutral-800 dark:text-neutral-200">Login</h3>
		<UForm :state="state" class="flex flex-col gap-2 min-w-72">
			<UiInput type="email" label="Email" v-model="state.email"></UiInput>
			<UiInput type="password" label="Password" v-model="state.password"></UiInput>
			<NuxtLink class="text-right text-xs leading-relaxed mb-1">Forgot Password?</NuxtLink>
			<UButton
				type="submit"
				@click="loginToFirebase('password', state.email, state.password)"
				class="justify-center text-white font-semibold w-full"
				:loading-auto="true"
				>Sign In</UButton
			>
		</UForm>
		<div id="login-social" class="text-sm mt-4">Login with social accounts</div>
		<div class="flex gap-4 my-6">
			<a href="#" @click.prevent="loginToFirebase('google')"> <UIcon name="fa-brands:google" class="size-6" /></a>
			<a href="#" aria-label="Log in with Apple" class="icon"><UIcon name="fa-brands:apple" class="size-6" /></a>
		</div>
		<div class="text-xs">Don't have an account? <a href="#" class="underline">Sign up</a></div>
	</section>
</template>
<script lang="ts" setup>
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

const state = reactive({
	email: "",
	password: "",
});
const router = useRouter();
const { $currentUser } = useNuxtApp();

definePageMeta({
	middleware: "is-not-logged-in",
});

watch($currentUser, (user) => {
	if (user.uid) router.push("/profile");
});

async function loginToFirebase(method: "google" | "password" = "google", email?: string, password?: string) {
	try {
		let newUser;
		if (method === "google") newUser = await loginWithGoogle();
		else if (method === "password" && (!password || !email)) throw new Error("Password or Email missing.");
		else if (method === "password" && password && email) newUser = await loginWithPassword(email, password);
		else throw new Error("Invalid login method.");
		return { data: newUser, error: null, status: 200, message: "User logged in successfully." };
	} catch (e: any) {
		return { data: null, error: e, status: 500, message: e?.message || "Unknown error" };
	}
}

async function loginWithGoogle() {
	const { $auth } = useNuxtApp();
	const provider = new GoogleAuthProvider();
	const { user } = await signInWithPopup($auth, provider);
	return user;
}

async function loginWithPassword(email: string, password: string) {
	const { $auth } = useNuxtApp();
	if (!email || !password) throw new Error("Email and password are required for password login.");
	const { user } = await signInWithEmailAndPassword($auth, email, password);
	return user;
}
</script>
<style scoped></style>
