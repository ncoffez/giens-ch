import { ADMIN_SHELL_KEYS } from "#shared/sitePermissions";
import { waitForAuthInitialization } from "../composables/useAuthReady";
import { sanitizeRedirectPath } from "../utils/redirect";

export default defineNuxtRouteMiddleware(async (to) => {
	if (import.meta.server) return;

	const nuxtApp = useNuxtApp();
	await waitForAuthInitialization(nuxtApp.$authInitialized);
	const localePath = useLocalePath();
	const token = nuxtApp.$token?.value;

	if (!token) {
		return navigateTo({
			path: localePath("/login"),
			query: { redirect: sanitizeRedirectPath(to.fullPath, localePath("/admin")) },
		});
	}

	const { can, refresh } = useSitePermissions();
	try {
		await refresh();
	} catch {
		return navigateTo(localePath("/"));
	}

	if (!ADMIN_SHELL_KEYS.some((key) => can(key))) {
		return navigateTo(localePath("/"));
	}
});
