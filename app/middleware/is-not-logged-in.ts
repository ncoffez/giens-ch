export default defineNuxtRouteMiddleware((_to, _from) => {
	// skip middleware on server
	if (import.meta.server) return;

	const { $currentUser } = useNuxtApp();
	if ($currentUser.value) return navigateTo("/profile");
	return true;
});
