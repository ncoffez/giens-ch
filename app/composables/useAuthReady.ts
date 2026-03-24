import type { Ref } from "vue";

export function useAuthReady() {
	const { $authInitialized, $token } = useNuxtApp();

	const waitForAuth = async () => {
		return waitForAuthInitialization($authInitialized);
	};

	const getFreshToken = async () => {
		await waitForAuth();
		return $token.value;
	};

	return {
		waitForAuth,
		getFreshToken,
		isReady: $authInitialized,
		token: $token,
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
