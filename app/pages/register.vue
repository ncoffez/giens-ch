<template>
	<section
		class="relative overflow-hidden flex flex-col items-center p-8 border-neutral-200 bg-white dark:bg-neutral-800 shadow-lg rounded-3xl my-16 mx-auto w-fit">
		<h3 class="font-bold text-2xl mb-4 text-neutral-800 dark:text-neutral-200">{{ t("auth.registerTitle") }}</h3>
		<p class="text-sm text-stone-500 dark:text-stone-400 mb-6 text-center max-w-xs">
			{{ t("auth.registerSubtitle") }}
		</p>
		<UForm :state="state" class="flex flex-col gap-2 min-w-72" @submit="register">
			<UiInput type="text" :label="t('auth.name')" v-model="state.name"></UiInput>
			<UiInput type="email" :label="t('auth.email')" v-model="state.email"></UiInput>
			<UiInput type="password" :label="t('auth.password')" v-model="state.password"></UiInput>
			<UiInput type="password" :label="t('auth.passwordConfirm')" v-model="state.confirmPassword"></UiInput>
			<UButton
				type="submit"
				class="justify-center text-white font-semibold w-full"
				:loading="loading">
				{{ t("auth.registerButton") }}
			</UButton>
		</UForm>
		<NuxtLink
			:to="localePath('/login')"
			class="text-sm mt-4 text-stone-500 dark:text-stone-400 hover:text-primary-600 dark:hover:text-primary-400">
			{{ t("auth.hasAccount") }} {{ t("auth.login") }}
		</NuxtLink>
	</section>
</template>

<script lang="ts" setup>
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

const { t } = useI18n();
const state = reactive({
	name: "",
	email: "",
	password: "",
	confirmPassword: "",
});
const router = useRouter();
const localePath = useLocalePath();
const { $ensureAuth } = useNuxtApp();
const toast = useToast();
const loading = ref(false);

function validateForm() {
	if (!state.name || !state.email || !state.password || !state.confirmPassword) {
		toast.add({
			color: "error",
			title: t("auth.errors.generic"),
			description: t("auth.errors.fieldsRequired"),
		});
		return false;
	}

	if (state.name.trim().length < 2) {
		toast.add({
			color: "error",
			title: t("auth.errors.generic"),
			description: t("auth.errors.nameMinLength"),
		});
		return false;
	}

	if (state.password.length < 6) {
		toast.add({
			color: "error",
			title: t("auth.errors.generic"),
			description: t("auth.errors.passwordMinLength"),
		});
		return false;
	}

	if (state.password !== state.confirmPassword) {
		toast.add({
			color: "error",
			title: t("auth.errors.generic"),
			description: t("auth.errors.passwordMismatch"),
		});
		return false;
	}

	return true;
}

async function register() {
	if (!validateForm()) return;

	loading.value = true;
	try {
		const auth = await $ensureAuth();
		const userCredential = await createUserWithEmailAndPassword(auth, state.email, state.password);
		await updateProfile(userCredential.user, { displayName: state.name.trim() });
		toast.add({
			color: "success",
			title: t("auth.success.register"),
			description: t("auth.success.register"),
		});
		router.push(localePath("/profile"));
	} catch (error: unknown) {
		toast.add({
			color: "error",
			title: t("auth.errors.generic"),
			description: (error instanceof Error && error.message) || t("auth.errors.generic"),
		});
	} finally {
		loading.value = false;
	}
}
</script>

<style scoped></style>
