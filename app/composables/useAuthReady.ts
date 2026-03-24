import type { Ref } from "vue";

export function useAuthReady() {
	const { $authInitialized, $token } = useNuxtApp();
	const fallbackReady = computed(() => import.meta.server);
	const readyRef = $authInitialized ?? fallbackReady;
	const tokenRef = $token ?? ref<string | null>(null);

	const waitForAuth = async () => {
		return waitForAuthInitialization(readyRef);
	};

	const getFreshToken = async () => {
		await waitForAuth();
		return tokenRef.value;
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

		const stop = watch(authInitialized, (initialized) => {
			if (initialized) {
				stop();
				resolve();
			}
		});
	});
}
