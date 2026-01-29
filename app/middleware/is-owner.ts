export const isOwnerLogic = async (nuxtApp: any) => {
	const { $isOwner } = nuxtApp;
	if ($isOwner.value) return true;
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

	return isOwnerLogic(nuxtApp);
});
