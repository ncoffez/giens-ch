import { ref } from "vue";
import { waitForAuthInitialization } from "./useAuthReady";

export function useAdminAuth() {
	const { $ensureAuth, $currentUser, $isAdmin, $authInitialized, $getAuthToken } = useNuxtApp();

	const isCheckingAuth = ref(false);
	const authError = ref<string | null>(null);

	/**
	 * Wait for Firebase auth to be initialized
	 */
async function waitForAuthInit(): Promise<void> {
		await waitForAuthInitialization($authInitialized);
	}

	/**
	 * Check if the current user has admin access
	 */
	async function checkAdminAccess(): Promise<boolean> {
		isCheckingAuth.value = true;
		authError.value = null;

		try {
			if (!$authInitialized.value) {
				await waitForAuthInit();
			}

			if (!$isAdmin.value) {
				return false;
			}

			const auth = await $ensureAuth();
			const user = auth.currentUser;
			if (!user) {
				authError.value = "Nicht authentifiziert";
				return false;
			}

			await user.getIdToken(true);
			return true;
		} catch (error: unknown) {
			authError.value = error instanceof Error ? error.message : "Authentifizierungsfehler";
			return false;
		} finally {
			isCheckingAuth.value = false;
		}
	}

	/**
	 * Get auth headers for API requests
	 */
	async function getAuthHeaders(): Promise<Record<string, string>> {
		try {
			const auth = await $ensureAuth();
			if (!auth.currentUser) {
				authError.value = "Nicht authentifiziert";
				return {};
			}

			const token = await $getAuthToken(true);
			if (!token) {
				authError.value = "Nicht authentifiziert";
				return {};
			}
			return { Authorization: `Bearer ${token}` };
		} catch (error: unknown) {
			authError.value = "Fehler beim Abrufen des Tokens";
			return {};
		}
	}

	return {
		isCheckingAuth,
		authError,
		checkAdminAccess,
		getAuthHeaders,
		isAdmin: $isAdmin,
		isAuthInitialized: $authInitialized,
		currentUser: $currentUser,
	};
}
