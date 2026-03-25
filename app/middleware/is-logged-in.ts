import type { MiddlewareNuxtApp } from "../../types/nuxt";
import { waitForAuthInitialization } from "../composables/useAuthReady";
import { sanitizeRedirectPath } from "../utils/redirect";

export const isLoggedInLogic = async (
	nuxtApp: MiddlewareNuxtApp,
	options?: { loginPath?: string; redirectPath?: string },
) => {
	await waitForAuthInitialization(nuxtApp.$authInitialized);

	const { $currentUser } = nuxtApp;
	if ($currentUser.value) return true;
	const loginPath = options?.loginPath || "/login";
	const redirectPath = sanitizeRedirectPath(options?.redirectPath, "/");
	return `${loginPath}?redirect=${encodeURIComponent(redirectPath)}`;
};

export default defineNuxtRouteMiddleware(async (to, _from) => {
	// skip middleware on server
	if (import.meta.server) return;

	const nuxtApp = useNuxtApp();
	const localePath = useLocalePath();
	return await isLoggedInLogic(nuxtApp, {
		loginPath: localePath("/login"),
		redirectPath: to.fullPath,
	});
});
