<template>
	<section
		class="relative overflow-hidden flex flex-col items-center p-8 border-neutral-200 bg-white dark:bg-neutral-800 shadow-lg rounded-3xl my-16 mx-auto w-fit">
		<h3 class="font-bold text-2xl mb-4 text-neutral-800 dark:text-neutral-200">{{ t("auth.loginTitle") }}</h3>
		<UForm :state="state" class="flex flex-col gap-2 min-w-72" @submit="submitPasswordLogin">
			<UiInput type="email" :label="t('auth.email')" v-model="state.email"></UiInput>
			<UiInput type="password" :label="t('auth.password')" v-model="state.password"></UiInput>
			<NuxtLink :to="localePath('/reset-password')" class="text-right text-xs leading-relaxed mb-1 text-stone-500 dark:text-stone-400 hover:text-primary-600 dark:hover:text-primary-400">{{ t("auth.forgotPassword") }}</NuxtLink>
			<UButton
				type="submit"
				class="justify-center text-white font-semibold w-full"
				loading-auto
				>{{ t("auth.loginButton") }}</UButton
			>
		</UForm>
		<div id="login-social" class="text-sm mt-4 text-stone-500 dark:text-stone-400">{{ t("auth.socialLogin") }}</div>
		<div class="flex gap-4 my-6">
			<button 
				@click.prevent="loginToFirebase('google')" 
				:aria-label="t('auth.login') + ' Google'" 
				class="w-12 h-12 flex items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
			>
				<UIcon name="fa-brands:google" class="size-6" />
			</button>
			<button 
				@click.prevent="loginWithApple" 
				:aria-label="t('auth.login') + ' Apple'" 
				class="w-12 h-12 flex items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
			>
				<UIcon name="fa-brands:apple" class="size-6" />
			</button>
		</div>
		<div class="text-xs text-stone-500 dark:text-stone-400">{{ t("auth.noAccount") }} <NuxtLink :to="localePath('/register')" class="underline hover:text-primary-600 dark:hover:text-primary-400">{{ t("auth.register") }}</NuxtLink></div>
	</section>
</template>
<script lang="ts" setup>
import { GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { sanitizeRedirectPath } from "~/utils/redirect";

const { t } = useI18n();
const state = reactive({
	email: "",
	password: "",
});
const router = useRouter();
const localePath = useLocalePath();
const { $currentUser } = useNuxtApp();
const toast = useAppToast();
const isRedirecting = ref(false);
const route = useRoute();

definePageMeta({
	middleware: "is-not-logged-in",
});

watch($currentUser, (user) => {
	if (user?.uid) {
		redirectAfterLogin();
	}
});

async function redirectAfterLogin() {
	if (isRedirecting.value) return;

	isRedirecting.value = true;
	try {
		const redirectTarget = sanitizeRedirectPath(route.query.redirect, getLoginFallbackRedirect());
		await router.replace(redirectTarget);
	} finally {
		isRedirecting.value = false;
	}
}

function getLoginFallbackRedirect() {
	if (!import.meta.client) {
		return localePath("/");
	}

	const referrer = document.referrer;

	if (!referrer) {
		return localePath("/");
	}

	try {
		const referrerUrl = new URL(referrer);

		if (referrerUrl.origin !== window.location.origin) {
			return localePath("/");
		}

		return sanitizeRedirectPath(
			`${referrerUrl.pathname}${referrerUrl.search}${referrerUrl.hash}`,
			localePath("/"),
		);
	} catch {
		return localePath("/");
	}
}

async function submitPasswordLogin() {
	await loginToFirebase("password", state.email, state.password);
}

async function loginToFirebase(method: "google" | "password", email?: string, password?: string) {
	try {
		if (method === "google") {
			await loginWithGoogle();
		} else if (method === "password" && (!password || !email)) {
			toast.error(t("auth.errors.generic"), t("auth.errors.emailRequired"), { report: false });
		} else if (method === "password" && password && email) {
			await loginWithPassword(email, password);
		}
	} catch (e: unknown) {
		toast.error(t("auth.errors.generic"), e?.message || t("auth.errors.generic"), {
			report: false,
			source: "login",
		});
	}
}

async function loginWithGoogle() {
	const { $ensureAuth } = useNuxtApp();
	const auth = await $ensureAuth();
	const provider = new GoogleAuthProvider();
	provider.addScope("email");
	provider.addScope("profile");
	try {
		await signInWithPopup(auth, provider);
		toast.success(t("auth.success.login"));
		await redirectAfterLogin();
	} catch (e: unknown) {
		throw new Error(e?.message || t("auth.errors.generic"));
	}
}

async function loginWithApple() {
	const { $ensureAuth } = useNuxtApp();
	const auth = await $ensureAuth();
	const provider = new OAuthProvider("apple.com");
	provider.addScope("email");
	provider.addScope("name");
	try {
		await signInWithPopup(auth, provider);
		toast.success(t("auth.success.login"));
		await redirectAfterLogin();
	} catch (e: unknown) {
		throw new Error(e?.message || t("auth.errors.generic"));
	}
}

async function loginWithPassword(email: string, password: string) {
	const { $ensureAuth } = useNuxtApp();
	if (!email || !password) throw new Error("Email and password are required for password login.");
	try {
		const auth = await $ensureAuth();
		const { user } = await signInWithEmailAndPassword(auth, email, password);
		if (!user.emailVerified) {
			toast.add({ color: "warning", title: t("auth.warnings.emailNotVerified"), description: t("auth.warnings.emailNotVerified") });
		}
		await redirectAfterLogin();
	} catch (e: unknown) {
		throw new Error(e?.message || t("auth.errors.generic"));
	}
}
</script>
<style scoped></style>
