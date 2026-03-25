import type { MiddlewareNuxtApp } from "../../types/nuxt";
import { waitForAuthInitialization } from "../composables/useAuthReady";

export const isNotLoggedInLogic = async (nuxtApp: MiddlewareNuxtApp) => {
	const { $currentUser } = nuxtApp;
	if ($currentUser.value) return "/";
	return true;
};

export default defineNuxtRouteMiddleware(async (_to, _from) => {
	if (import.meta.server) return;

	const nuxtApp = useNuxtApp();
	await waitForAuthInitialization(nuxtApp.$authInitialized);

	return isNotLoggedInLogic(nuxtApp);
});
