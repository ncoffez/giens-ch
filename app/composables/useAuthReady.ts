export function useAuthReady() {
	const { $authInitialized, $token } = useNuxtApp();

	const waitForAuth = async () => {
		return new Promise<void>((resolve) => {
			if ($authInitialized.value) {
				resolve();
				return;
			}
			
			const stop = watch($authInitialized, (initialized) => {
				if (initialized) {
					stop();
					resolve();
				}
			});
		});
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
