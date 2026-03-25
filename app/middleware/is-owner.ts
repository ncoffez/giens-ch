import type { MiddlewareNuxtApp } from "../../types/nuxt";
import { waitForAuthInitialization } from "../composables/useAuthReady";
import { sanitizeRedirectPath } from "../utils/redirect";

export const isOwnerLogic = async (
	nuxtApp: MiddlewareNuxtApp,
	options?: { loginPath?: string; redirectPath?: string },
) => {
	if (!nuxtApp.$currentUser.value) {
		const loginPath = options?.loginPath || "/login";
		const redirectPath = sanitizeRedirectPath(options?.redirectPath, "/");
		return `${loginPath}?redirect=${encodeURIComponent(redirectPath)}`;
	}

	const { $isOwner } = nuxtApp;
	if ($isOwner.value) return true;
	return "/";
};

export default defineNuxtRouteMiddleware(async (to, _from) => {
	if (import.meta.server) return;

	const nuxtApp = useNuxtApp();
	await waitForAuthInitialization(nuxtApp.$authInitialized);

	return isOwnerLogic(nuxtApp, {
		loginPath: useLocalePath()("/login"),
		redirectPath: to.fullPath,
	});
});
