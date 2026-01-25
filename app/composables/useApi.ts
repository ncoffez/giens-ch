import { useNuxtApp } from "#app";

export function useApi() {
	const { $auth } = useNuxtApp();

	const getHeaders = async () => {
		const token = await $auth.currentUser?.getIdToken();
		return token ? { Authorization: `Bearer ${token}` } : {};
	};

	const authorizedFetch = async (url: string, options: any = {}) => {
		const headers = await getHeaders();
		return $fetch(url, {
			...options,
			headers: {
				...options.headers,
				...headers,
			},
		});
	};

	return {
		getHeaders,
		authorizedFetch,
	};
}
