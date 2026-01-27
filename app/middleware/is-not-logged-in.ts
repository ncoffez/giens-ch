export default defineNuxtRouteMiddleware(async (_to, _from) => {
	if (import.meta.server) return;

	const { $currentUser, $authInitialized } = useNuxtApp();

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

	if ($currentUser.value) return navigateTo("/profile");
	return true;
});
