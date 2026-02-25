import { ref } from "vue";

export function useAdminAuth() {
	const { $auth, $currentUser, $isAdmin, $authInitialized } = useNuxtApp();

	const isCheckingAuth = ref(false);
	const authError = ref<string | null>(null);

	/**
	 * Wait for Firebase auth to be initialized
	 */
	async function waitForAuthInit(): Promise<void> {
		return new Promise<void>((resolve) => {
			const checkInterval = setInterval(() => {
				if ($authInitialized.value) {
					clearInterval(checkInterval);
					resolve();
				}
			}, 50);
		});
	}

	/**
	 * Check if the current user has admin access
	 */
	async function checkAdminAccess(): Promise<boolean> {
		isCheckingAuth.value = true;
		authError.value = null;

		try {
			if (!$authInitialized.value) {
				console.log("AdminAuth: Waiting for auth initialization...");
				await waitForAuthInit();
			}

			if (!$isAdmin.value) {
				console.warn("AdminAuth: Access denied - not an admin");
				return false;
			}

			const user = $auth.currentUser;
			if (!user) {
				console.warn("AdminAuth: No current user found in auth");
				authError.value = "Nicht authentifiziert";
				return false;
			}

			const token = await user.getIdToken(true);
			console.log("AdminAuth: Admin access verified");
			return true;
		} catch (error: unknown) {
			console.error("AdminAuth: Auth check error", error);
			authError.value = error.message || "Authentifizierungsfehler";
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
			const user = $auth.currentUser;
			if (!user) {
				authError.value = "Nicht authentifiziert";
				return {};
			}

			const token = await user.getIdToken(true);
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