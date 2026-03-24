import type { MiddlewareNuxtApp } from "../../types/nuxt";
import { waitForAuthInitialization } from "../composables/useAuthReady";

export const isAdminLogic = async (nuxtApp: MiddlewareNuxtApp) => {
	const { $isAdmin } = nuxtApp;
	if ($isAdmin.value) return true;
	return "/";
};

export default defineNuxtRouteMiddleware(async (_to, _from) => {
	// skip middleware on server
	if (import.meta.server) return;

	const nuxtApp = useNuxtApp();
	await waitForAuthInitialization(nuxtApp.$authInitialized);

	return isAdminLogic(nuxtApp);
});
