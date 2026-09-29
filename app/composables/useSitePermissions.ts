import { EMPTY_PERMISSION_CONFIG, canAccessDocuments, canPerform } from "#shared/sitePermissions";

interface PermissionResponse {
	actions: Record<string, boolean>;
}

export function useSitePermissions() {
	const nuxtApp = useNuxtApp();
	const actions = useState<Record<string, boolean>>("site-permissions", () => ({}));
	const loaded = useState("site-permissions-loaded", () => false);
	const loadedFor = useState<string | null>("site-permissions-user", () => null);

	function claimSet() {
		const claims = import.meta.client ? nuxtApp.$claims?.value : null;
		if (!claims) return null;
		return {
			admin: !!claims.admin,
			publisher: !!claims.publisher,
			owner: !!claims.owner,
			reader: !!claims.reader,
		};
	}

	function fallback(key: string) {
		const claims = claimSet();
		if (!claims) return false;
		if (key === "documents.access") return canAccessDocuments(EMPTY_PERMISSION_CONFIG, [], claims);
		return canPerform(EMPTY_PERMISSION_CONFIG, claims, key);
	}

	function can(key: string) {
		if (loaded.value && Object.prototype.hasOwnProperty.call(actions.value, key)) {
			return !!actions.value[key];
		}
		return fallback(key);
	}

	async function refresh() {
		if (!import.meta.client) return;
		const token = await nuxtApp.$getAuthToken?.();
		const uid = nuxtApp.$currentUser?.value?.uid || null;
		if (!token || !uid) {
			actions.value = {};
			loaded.value = false;
			loadedFor.value = null;
			return;
		}

		const result = await $fetch<PermissionResponse>("/api/permissions/me", {
			headers: { Authorization: `Bearer ${token}` },
		});
		actions.value = result.actions || {};
		loaded.value = true;
		loadedFor.value = uid;
	}

	return { actions, loaded, can, refresh };
}
