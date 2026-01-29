export const isNotLoggedInLogic = async (nuxtApp: any) => {
	const { $currentUser } = nuxtApp;
	if ($currentUser.value) return "/profile";
	return true;
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

	return isNotLoggedInLogic(nuxtApp);
});
