import type { MiddlewareNuxtApp } from "../../types/nuxt";

export const homesFeatureLogic = async (nuxtApp: MiddlewareNuxtApp) => {
	const { $isAdmin } = nuxtApp;
	
	if ($isAdmin.value) return true;

	const { canAccessHomes, fetchSettings } = useFeatureFlags();
	await fetchSettings();
	
	if (canAccessHomes.value) return true;
	return "/";
};

export default defineNuxtRouteMiddleware(async (_to, _from) => {
	if (import.meta.server) return;

	const nuxtApp = useNuxtApp();

	if (!nuxtApp.$authInitialized.value) {
		await new Promise((resolve) => {
			const unwatch = watch(nuxtApp.$authInitialized, (val) => {
				if (val) {
					unwatch();
					resolve(true);
				}
			});
		});
	}

	return homesFeatureLogic(nuxtApp);
});
