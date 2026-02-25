import type { MiddlewareNuxtApp } from "../../types/nuxt";

export const isLoggedInLogic = (nuxtApp: MiddlewareNuxtApp) => {
	const { $currentUser } = nuxtApp;
	if ($currentUser.value) return true;
	return "/login";
};

export default defineNuxtRouteMiddleware((_to, _from) => {
	// skip middleware on server
	if (import.meta.server) return;

	const nuxtApp = useNuxtApp();
	return isLoggedInLogic(nuxtApp);
});
