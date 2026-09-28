import { waitForAuthInitialization } from "../composables/useAuthReady";
import { sanitizeRedirectPath } from "../utils/redirect";

export default defineNuxtRouteMiddleware(async (to) => {
	if (import.meta.server) return;

	const key = typeof to.meta.permission === "string" ? to.meta.permission : "";
	if (!key) return;

	const nuxtApp = useNuxtApp();
	await waitForAuthInitialization(nuxtApp.$authInitialized);
	const localePath = useLocalePath();
	const token = nuxtApp.$token?.value;

	if (!token) {
		return navigateTo({
			path: localePath("/login"),
			query: { redirect: sanitizeRedirectPath(to.fullPath, localePath("/")) },
		});
	}

	const { can, refresh } = useSitePermissions();
	try {
		await refresh();
	} catch {
		return navigateTo(localePath("/"));
	}

	if (!can(key)) {
		return navigateTo(localePath("/"));
	}
});
