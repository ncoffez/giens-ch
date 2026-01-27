import { describe, it, expect } from "vitest";
import { createApiError, isApiError, handleApiError, safeJsonParse } from "../../server/utils/apiError";

describe("API Error Utilities", () => {
	describe("createApiError", () => {
		it("should create an API error with statusCode and message", () => {
			const error = createApiError(404, "Not found");
			expect(error.statusCode).toBe(404);
			expect(error.message).toBe("Not found");
			expect(error.data).toBeUndefined();
		});

		it("should create an API error with data", () => {
			const data = { field: "value" };
			const error = createApiError(400, "Bad request", data);
			expect(error.data).toEqual(data);
		});
	});

	describe("isApiError", () => {
		it("should return truthy for API errors", () => {
			const error = createApiError(400, "Bad request");
			expect(isApiError(error)).toBeTruthy();
		});

		it("should return falsy for non-API errors", () => {
			expect(isApiError(null)).toBeFalsy();
			expect(isApiError(undefined)).toBeFalsy();
			expect(isApiError({})).toBeFalsy();
			expect(isApiError({ message: "text" })).toBeFalsy();
			expect(isApiError({ statusCode: 400 })).toBeFalsy();
		});
	});

	describe("handleApiError", () => {
		it("should return API errors as-is", () => {
			const apiError = createApiError(400, "Bad request");
			const result = handleApiError(apiError);
			expect(result).toEqual(apiError);
		});

		it("should handle errors with statusCode and message", () => {
			const error = { statusCode: 403, message: "Forbidden", data: { test: "value" } };
			const result = handleApiError(error);
			expect(result.statusCode).toBe(403);
			expect(result.message).toBe("Forbidden");
			expect(result.data).toEqual({ test: "value" });
		});

		it("should handle Firebase auth errors with known codes", () => {
			const error1 = { code: "auth/user-not-found" };
			const result1 = handleApiError(error1);
			expect(result1.statusCode).toBe(400);
			expect(result1.message).toBe("Benutzer nicht gefunden");

			const error2 = { code: "auth/invalid-credential" };
			const result2 = handleApiError(error2);
			expect(result2.statusCode).toBe(400);
			expect(result2.message).toBe("Ungültige Anmeldedaten");

			const error3 = { code: "permission-denied" };
			const result3 = handleApiError(error3);
			expect(result3.statusCode).toBe(403);
			expect(result3.message).toBe("Zugriff verweigert");
		});

		it("should handle Firebase auth errors with unknown codes", () => {
			const error = { code: "auth/unknown-code", message: "Custom message" };
			const result = handleApiError(error);
			expect(result.statusCode).toBe(400);
			expect(result.message).toBe("Custom message");
		});

		it("should handle Firebase auth errors without message", () => {
			const error = { code: "auth/unknown-code" };
			const result = handleApiError(error);
			expect(result.statusCode).toBe(400);
			expect(result.message).toBe("Ein Fehler ist aufgetreten");
		});

		it("should handle network errors", () => {
			const error = new TypeError("Failed to fetch");
			const result = handleApiError(error);
			expect(result.statusCode).toBe(503);
			expect(result.message).toContain("Netzwerkfehler");
		});

		it("should handle generic errors with message", () => {
			const error = new Error("Generic error");
			const result = handleApiError(error);
			expect(result.statusCode).toBe(500);
			expect(result.message).toBe("Generic error");
		});

		it("should handle errors without message", () => {
			const error = {};
			const result = handleApiError(error);
			expect(result.statusCode).toBe(500);
			expect(result.message).toBe("Ein unerwarteter Fehler ist aufgetreten");
		});
	});

	describe("safeJsonParse", () => {
		it("should parse valid JSON", () => {
			const result = safeJsonParse('{"key":"value"}', {});
			expect(result).toEqual({ key: "value" });
		});

		it("should return fallback for invalid JSON", () => {
			const fallback = { default: "value" };
			const result = safeJsonParse("invalid-json", fallback);
			expect(result).toEqual(fallback);
		});

		it("should return fallback for empty string", () => {
			const fallback = "default";
			const result = safeJsonParse("", fallback);
			expect(result).toBe(fallback);
		});
	});
});