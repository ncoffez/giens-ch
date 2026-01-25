export default defineNuxtRouteMiddleware((_to, _from) => {
	if (import.meta.server) return;
	const { $isPublisher } = useNuxtApp();
	if ($isPublisher.value) return true;
	return navigateTo("/");
});
