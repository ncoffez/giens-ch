import type { Ref } from "vue";

export function useAuthReady() {
	const { $authInitialized, $token, $ensureAuth, $getAuthToken } = useNuxtApp();
	const fallbackReady = computed(() => import.meta.server);
	const readyRef = $authInitialized ?? fallbackReady;
	const tokenRef = $token ?? ref<string | null>(null);

	const waitForAuth = async () => {
		if (import.meta.client) {
			await $ensureAuth?.();
		}
		return waitForAuthInitialization(readyRef);
	};

	const getFreshToken = async () => {
		await waitForAuth();
		return await ($getAuthToken?.(true) ?? Promise.resolve(tokenRef.value));
	};

	return {
		waitForAuth,
		getFreshToken,
		isReady: readyRef,
		token: tokenRef,
	};
}

export function waitForAuthInitialization(authInitialized: Readonly<Ref<boolean>>) {
	return new Promise<void>((resolve) => {
		if (authInitialized.value) {
			resolve();
			return;
		}

		if (import.meta.client) {
			const nuxtApp = useNuxtApp();
			void nuxtApp.$ensureAuth?.();
		}

		const stop = watch(authInitialized, (initialized) => {
			if (initialized) {
				stop();
				resolve();
			}
		});
	});
}
