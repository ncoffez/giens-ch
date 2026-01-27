export default defineNuxtRouteMiddleware(async (_to, _from) => {
	if (import.meta.server) return;

	const { $isOwner, $authInitialized } = useNuxtApp();

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

	if ($isOwner.value) return true;
	return navigateTo("/");
});
