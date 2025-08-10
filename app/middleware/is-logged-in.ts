export default defineNuxtRouteMiddleware((to, _from) => {
	// skip middleware on server
	if (import.meta.server) return;

	const { $currentUser } = useNuxtApp();
	if ($currentUser.value) return true;
	return navigateTo("/login");
});
