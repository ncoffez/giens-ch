export const isAdminLogic = async (nuxtApp: any) => {
	const { $isAdmin } = nuxtApp;
	if ($isAdmin.value) return true;
	return "/";
};

export default defineNuxtRouteMiddleware(async (_to, _from) => {
	// skip middleware on server
	if (import.meta.server) return;

	const nuxtApp = useNuxtApp();

	// Wait for auth to initialize
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

	return isAdminLogic(nuxtApp);
});
