export default defineNuxtRouteMiddleware(async (_to, _from) => {
	// skip middleware on server
	if (import.meta.server) return;

	const { $isAdmin, $authInitialized } = useNuxtApp();

	// Wait for auth to initialize
	if (!$authInitialized.value) {
		await new Promise((resolve) => {
			const unwatch = watch($authInitialized, (val) => {
				if (val) {
					unwatch();
					resolve(true);
				}
			});
		});
	}

	if ($isAdmin.value) return true;
	return navigateTo("/");
});
