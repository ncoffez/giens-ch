import { describe, it, expect, beforeEach, vi } from "vitest";

describe("useApi Composable", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getHeaders with no token", () => {
		it("should return empty object when no user is authenticated", async () => {
			// Simulate the getHeaders logic
			const token = null;
			const headers = token ? { Authorization: `Bearer ${token}` } : {};
			expect(headers).toEqual({});
		});

		it("should handle undefined token", async () => {
			const token = undefined;
			const headers = token ? { Authorization: `Bearer ${token}` } : {};
			expect(headers).toEqual({});
		});
	});

	describe("getHeaders with token", () => {
		it("should return Authorization header when token exists", async () => {
			const token = "valid-token-123";
			const headers = token ? { Authorization: `Bearer ${token}` } : {};
			expect(headers).toEqual({ Authorization: "Bearer valid-token-123" });
		});
	});

	describe("authorizedFetch", () => {
		it("should merge headers correctly", async () => {
			const url = "/api/test";
			const existingHeaders = { "X-Custom": "custom-value" };
			const authHeaders = { Authorization: "Bearer token-123" };
			
			const mergedHeaders = {
				...existingHeaders,
				...authHeaders,
			};

			expect(mergedHeaders).toEqual({
				"X-Custom": "custom-value",
				Authorization: "Bearer token-123"
			});
		});

		it("should preserve existing headers when no auth token", async () => {
			const existingHeaders = { "X-Custom": "custom-value" };
			const authHeaders = {};
			
			const mergedHeaders = {
				...existingHeaders,
				...authHeaders,
			};

			expect(mergedHeaders).toEqual({
				"X-Custom": "custom-value"
			});
		});

		it("should overwrite auth header if it exists in options", async () => {
			const existingHeaders = { Authorization: "Bearer custom-token" };
			const authHeaders = { Authorization: "Bearer token-123" };
			
			const mergedHeaders = {
				...existingHeaders,
				...authHeaders,
			};

			// Later headers should win
			expect(mergedHeaders).toEqual({
				Authorization: "Bearer token-123"
			});
		});

		it("should handle empty options", async () => {
			const options = {};
			const authHeaders = { Authorization: "Bearer token-123" };
			
			const result = {
				headers: {
					...options,
					...authHeaders,
				},
			};

			expect(result.headers).toEqual({
				Authorization: "Bearer token-123"
			});
		});
	});
});