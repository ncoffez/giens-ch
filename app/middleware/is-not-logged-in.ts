import type { MiddlewareNuxtApp } from "../../types/nuxt";
import { waitForAuthInitialization } from "../composables/useAuthReady";
import { sanitizeRedirectPath } from "../utils/redirect";

export const isNotLoggedInLogic = async (
	nuxtApp: MiddlewareNuxtApp,
	redirectPath?: string,
) => {
	const { $currentUser } = nuxtApp;
	if ($currentUser.value) return sanitizeRedirectPath(redirectPath, "/");
	return true;
};

export default defineNuxtRouteMiddleware(async (to, _from) => {
	if (import.meta.server) return;

	const nuxtApp = useNuxtApp();
	await waitForAuthInitialization(nuxtApp.$authInitialized);

	const redirectPath = typeof to.query.redirect === "string" ? to.query.redirect : undefined;
	return isNotLoggedInLogic(nuxtApp, redirectPath);
});
