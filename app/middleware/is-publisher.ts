export const isPublisherLogic = async (nuxtApp: any) => {
	const { $isPublisher } = nuxtApp;
	if ($isPublisher.value) return true;
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

	return isPublisherLogic(nuxtApp);
});
