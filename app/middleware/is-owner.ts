import type { MiddlewareNuxtApp } from "../../types/nuxt";
import { waitForAuthInitialization } from "../composables/useAuthReady";

export const isOwnerLogic = async (nuxtApp: MiddlewareNuxtApp) => {
	const { $isOwner } = nuxtApp;
	if ($isOwner.value) return true;
	return "/";
};

export default defineNuxtRouteMiddleware(async (_to, _from) => {
	if (import.meta.server) return;

	const nuxtApp = useNuxtApp();
	await waitForAuthInitialization(nuxtApp.$authInitialized);

	return isOwnerLogic(nuxtApp);
});
