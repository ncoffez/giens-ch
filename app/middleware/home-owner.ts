import type { MiddlewareNuxtApp } from "../../types/nuxt";
import { waitForAuthInitialization } from "../composables/useAuthReady";
import { sanitizeRedirectPath } from "../utils/redirect";

export const homeOwnerLogic = async (
	nuxtApp: MiddlewareNuxtApp,
	homeId: string,
	options?: { loginPath?: string; redirectPath?: string },
) => {
	const { $isAdmin, $token } = nuxtApp;

	if ($isAdmin?.value) {
		return true;
	}

	const token = $token?.value;
	if (!token) {
		return {
			redirect: `${options?.loginPath || "/login"}?redirect=${encodeURIComponent(sanitizeRedirectPath(options?.redirectPath, `/homes/${homeId}/edit`))}`,
			reason: "no_token",
		};
	}

	try {
		await $fetch(`/api/homes/${homeId}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		return true;
	} catch (error: unknown) {
		const status = (error as { response?: { status?: number } })?.response?.status;

		if (status === 403) {
			return { redirect: "/", reason: "not_owner" };
		}

		if (status === 404) {
			return { redirect: "/", reason: "not_found" };
		}

		return { redirect: "/", reason: "api_error" };
	}
};

export default defineNuxtRouteMiddleware(async (to, _from) => {
	if (import.meta.server) return;

	const nuxtApp = useNuxtApp();
	const homeId = to.params.id as string;
	await waitForAuthInitialization(nuxtApp.$authInitialized);

	const localePath = useLocalePath();
	const result = await homeOwnerLogic(nuxtApp, homeId, {
		loginPath: localePath("/login"),
		redirectPath: to.fullPath,
	});

	if (result === true) {
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

	toast.add({
		title: message.title,
		description: message.description,
		color: "error",
	});

	return navigateTo(result.redirect as string);
});
