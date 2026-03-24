import type { MiddlewareNuxtApp } from "../../types/nuxt";
import { waitForAuthInitialization } from "../composables/useAuthReady";

export const isLoggedInLogic = async (nuxtApp: MiddlewareNuxtApp) => {
	await waitForAuthInitialization(nuxtApp.$authInitialized);

	const { $currentUser } = nuxtApp;
	if ($currentUser.value) return true;
	return "/login";
};

export default defineNuxtRouteMiddleware(async (_to, _from) => {
	// skip middleware on server
	if (import.meta.server) return;

	const nuxtApp = useNuxtApp();
	return await isLoggedInLogic(nuxtApp);
});
