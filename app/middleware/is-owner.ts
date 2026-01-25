export default defineNuxtRouteMiddleware((_to, _from) => {
	if (import.meta.server) return;
	const { $isOwner } = useNuxtApp();
	if ($isOwner.value) return true;
	return navigateTo("/");
});
