import { useNuxtApp } from "#app";
import type { NitroFetchRequest, AvailableRouterMethod, NitroFetchOptions } from "nitropack";

export function useApi() {
	const { $getAuthToken } = useNuxtApp();

	const getHeaders = async (): Promise<Record<string, string>> => {
		const token = await $getAuthToken();
		return token ? { Authorization: `Bearer ${token}` } : {};
	};

	const authorizedFetch = async <T = unknown>(
		url: NitroFetchRequest,
		options: NitroFetchOptions<NitroFetchRequest, AvailableRouterMethod<NitroFetchRequest>> = {}
	): Promise<T> => {
		const authHeaders = await getHeaders();
		return $fetch(url, {
			...options,
			headers: {
				...(options.headers as Record<string, string>),
				...authHeaders,
			},
		}) as Promise<T>;
	};

	return {
		getHeaders,
		authorizedFetch,
	};
}
