import type { MiddlewareNuxtApp } from "../../types/nuxt";

export const homeOwnerLogic = async (nuxtApp: MiddlewareNuxtApp, homeId: string) => {
	console.log("[home-owner] ========== START ACCESS CHECK ==========");
	console.log("[home-owner] Checking access for home:", homeId);

	const { $isAdmin, $currentUser, $token } = nuxtApp;

	console.log("[home-owner] Auth initialized:", !!nuxtApp.$authInitialized?.value);
	console.log("[home-owner] Current user:", $currentUser?.value?.email || "not logged in");
	console.log("[home-owner] User UID:", $currentUser?.value?.uid || "none");
	console.log("[home-owner] Is admin:", $isAdmin?.value || false);

	// Admins can always access
	if ($isAdmin?.value) {
		console.log("[home-owner] ACCESS GRANTED: User is admin");
		console.log("[home-owner] ========== END ACCESS CHECK ==========");
		return true;
	}

	// Check token availability
	const token = $token?.value;
	console.log("[home-owner] Token available:", !!token);

	if (!token) {
		console.log("[home-owner] ACCESS DENIED: No auth token");
		console.log("[home-owner] ========== END ACCESS CHECK ==========");
		return { redirect: "/", reason: "no_token" };
	}

	// Check home ownership via API
	console.log("[home-owner] Fetching home data from API...");
	try {
		const home = await $fetch(`/api/homes/${homeId}`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		console.log("[home-owner] API response: Home found");
		console.log("[home-owner] Home name:", (home as any)?.name);
		console.log("[home-owner] Home owners:", (home as any)?.ownerIds);

		console.log("[home-owner] ACCESS GRANTED: User has access to this home");
		console.log("[home-owner] ========== END ACCESS CHECK ==========");
		return true;
	} catch (error: unknown) {
		const status = (error as { response?: { status?: number } })?.response?.status;
		console.log("[home-owner] API error status:", status);

		if (status === 403) {
			console.log("[home-owner] ACCESS DENIED: User is not in ownerIds");
			console.log("[home-owner] ========== END ACCESS CHECK ==========");
			return { redirect: "/", reason: "not_owner" };
		}

		if (status === 404) {
			console.log("[home-owner] ACCESS DENIED: Home not found");
			console.log("[home-owner] ========== END ACCESS CHECK ==========");
			return { redirect: "/", reason: "not_found" };
		}

		console.log("[home-owner] ACCESS DENIED: API error");
		console.log("[home-owner] Error:", error);
		console.log("[home-owner] ========== END ACCESS CHECK ==========");
		return { redirect: "/", reason: "api_error" };
	}
};

export default defineNuxtRouteMiddleware(async (to, _from) => {
	if (import.meta.server) return;

	console.log("[home-owner] Middleware triggered for route:", to.path);

	const nuxtApp = useNuxtApp();
	const homeId = to.params.id as string;

	console.log("[home-owner] Home ID from params:", homeId);

	// Wait for auth initialization
	if (!nuxtApp.$authInitialized?.value) {
		console.log("[home-owner] Waiting for auth initialization...");
		await new Promise((resolve) => {
			const unwatch = watch(nuxtApp.$authInitialized, (val) => {
				if (val) {
					console.log("[home-owner] Auth initialized");
					unwatch();
					resolve(true);
				}
			});
		});
	}

	const result = await homeOwnerLogic(nuxtApp, homeId);

	if (result === true) {
		console.log("[home-owner] Proceeding to page");
		return;
	}

	// Access denied - show toast and redirect
	const toast = useToast();
	const reason = (result as { reason?: string })?.reason;

	const messages: Record<string, { title: string; description: string }> = {
		no_token: {
			title: "Nicht angemeldet",
			description: "Bitte melden Sie sich an, um fortzufahren.",
		},
		not_owner: {
			title: "Zugriff verweigert",
			description: "Sie sind nicht als Eigentümer dieses Hauses eingetragen.",
		},
		not_found: {
			title: "Haus nicht gefunden",
			description: "Das angeforderte Haus existiert nicht.",
		},
		api_error: {
			title: "Fehler",
			description: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
		},
	};

	const message = messages[reason || "api_error"];
	console.log("[home-owner] Showing toast:", message.title);

	toast.add({
		title: message.title,
		description: message.description,
		color: "error",
	});

	return navigateTo(result.redirect as string);
});
