import { useNuxtApp } from "#app";
import type { NitroFetchRequest, AvailableRouterMethod, NitroFetchOptions } from "nitropack";

type AuthorizedFetchOptions<T extends NitroFetchRequest> = NitroFetchOptions<T, AvailableRouterMethod<T>> & {
	forceRefresh?: boolean;
	retryOnExpiredToken?: boolean;
};

export function isExpiredIdTokenError(error: unknown): boolean {
	if (typeof error !== "object" || error === null) {
		return false;
	}

	const err = error as Record<string, unknown>;
	const message = typeof err.message === "string" ? err.message : "";
	const dataMessage = typeof err.data === "object" && err.data !== null && typeof (err.data as Record<string, unknown>).message === "string"
		? String((err.data as Record<string, unknown>).message)
		: "";
	const statusCode = typeof err.statusCode === "number"
		? err.statusCode
		: typeof err.status === "number"
			? err.status
			: undefined;
	const combinedMessage = `${message} ${dataMessage}`;

	return statusCode === 401 && combinedMessage.includes("id-token-expired");
}

export function useApi() {
	const { $getAuthToken } = useNuxtApp();

	const getHeaders = async (forceRefresh = false): Promise<Record<string, string>> => {
		const token = await $getAuthToken(forceRefresh);
		return token ? { Authorization: `Bearer ${token}` } : {};
	};

	const authorizedFetch = async <T = unknown>(
		url: NitroFetchRequest,
		options: AuthorizedFetchOptions<NitroFetchRequest> = {}
	): Promise<T> => {
		const { forceRefresh = false, retryOnExpiredToken = true, ...fetchOptions } = options;

		const runFetch = async (refreshToken: boolean) => {
			const authHeaders = await getHeaders(refreshToken);
			return $fetch(url, {
				...fetchOptions,
				headers: {
					...(fetchOptions.headers as Record<string, string>),
					...authHeaders,
				},
			}) as Promise<T>;
		};

		try {
			return await runFetch(forceRefresh);
		} catch (error: unknown) {
			if (!retryOnExpiredToken || forceRefresh || !isExpiredIdTokenError(error)) {
				throw error;
			}

			return await runFetch(true);
		}
	};

	return {
		getHeaders,
		authorizedFetch,
	};
}
