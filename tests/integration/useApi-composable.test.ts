import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthTokenMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("#app", () => ({
	useNuxtApp: () => ({
		$getAuthToken: getAuthTokenMock,
	}),
}));

describe("useApi Composable", () => {
	beforeEach(() => {
		getAuthTokenMock.mockReset();
		fetchMock.mockReset();
		vi.stubGlobal("$fetch", fetchMock);
	});

	it("returns authorization headers when a token is available", async () => {
		getAuthTokenMock.mockResolvedValueOnce("valid-token-123");

		const { useApi } = await import("../../app/composables/useApi");
		const { getHeaders } = useApi();
		const headers = await getHeaders();

		expect(getAuthTokenMock).toHaveBeenCalledWith(false);
		expect(headers).toEqual({ Authorization: "Bearer valid-token-123" });
	});

	it("retries once with a forced token refresh when the first request hits an expired token", async () => {
		getAuthTokenMock
			.mockResolvedValueOnce("stale-token")
			.mockResolvedValueOnce("fresh-token");
		fetchMock
			.mockRejectedValueOnce({
				statusCode: 401,
				data: {
					message: "Firebase ID token has expired. Get a fresh ID token from your client app and try again (auth/id-token-expired).",
				},
			})
			.mockResolvedValueOnce({ ok: true });

		const { useApi } = await import("../../app/composables/useApi");
		const { authorizedFetch } = useApi();
		const result = await authorizedFetch("/api/content/test", {
			method: "POST",
			body: { content: "hello" },
		});

		expect(result).toEqual({ ok: true });
		expect(getAuthTokenMock).toHaveBeenNthCalledWith(1, false);
		expect(getAuthTokenMock).toHaveBeenNthCalledWith(2, true);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
			headers: {
				Authorization: "Bearer fresh-token",
			},
		});
	});

	it("does not retry non-expired authorization failures", async () => {
		const error = {
			statusCode: 401,
			data: {
				message: "Unauthorized",
			},
		};

		getAuthTokenMock.mockResolvedValueOnce("token-123");
		fetchMock.mockRejectedValueOnce(error);

		const { useApi } = await import("../../app/composables/useApi");
		const { authorizedFetch } = useApi();

		await expect(authorizedFetch("/api/content/test")).rejects.toEqual(error);
		expect(getAuthTokenMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});
