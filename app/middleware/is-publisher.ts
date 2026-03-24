import type { MiddlewareNuxtApp } from "../../types/nuxt";
import { waitForAuthInitialization } from "../composables/useAuthReady";

export const isPublisherLogic = async (nuxtApp: MiddlewareNuxtApp) => {
	const { $isPublisher } = nuxtApp;
	if ($isPublisher.value) return true;
	return "/";
};

export default defineNuxtRouteMiddleware(async (_to, _from) => {
	if (import.meta.server) return;

	const nuxtApp = useNuxtApp();
	await waitForAuthInitialization(nuxtApp.$authInitialized);

	return isPublisherLogic(nuxtApp);
});
