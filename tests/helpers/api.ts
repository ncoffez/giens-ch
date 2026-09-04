import { registerEndpoint } from "@nuxt/test-utils/runtime";
import type { H3Event } from "h3";

/**
 * API helpers for testing server endpoints
 * Provides utilities to mock API responses and test error cases
 */

export type MockEndpointHandler = (event: H3Event) => any;

/**
 * Registers a mock API endpoint with given handler
 * @param endpoint - The endpoint URL (e.g., "/api/users")
 * @param method - HTTP method (GET, POST, PUT, DELETE)
 * @param handler - Handler function that returns mock data
 * @returns Endpoint config for cleanup
 */
export function mockApiEndpoint(
	endpoint: string,
	method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
	handler: MockEndpointHandler,
) {
	registerEndpoint(endpoint, {
		method,
		handler,
	});

	return { endpoint, method };
}

/**
 * Helper to mock successful responses
 */
export function createSuccessResponse(data: any) {
	return {
		statusCode: 200,
		data,
	};
}

/**
 * Helper to mock error responses
 */
export function createErrorResponse(
	statusCode: number,
	message: string,
	data?: any,
	errorCode?: string
) {
	return {
		statusCode,
		message,
		error: errorCode?.toString(),
		data,
	};
}

/**
 * Standard error factories
 */
export const ErrorFactory = {
	auth: {
		unauthorized: () => createErrorResponse(401, "Nicht authentifiziert", undefined, "unauthorized"),
		forbidden: () => createErrorResponse(403, "Zugriff verweigert", undefined, "permission-denied"),
		invalidCredential: () =>
			createErrorResponse(400, "Ungültige Anmeldedaten", undefined, "auth/invalid-credential"),
		userNotFound: () => createErrorResponse(404, "Benutzer nicht gefunden", undefined, "auth/user-not-found"),
		emailNotVerified: () =>
			createErrorResponse(403, "Bitte verifizieren Sie Ihre E-Mail-Adresse", undefined, "auth/email-not-verified"),
	},
	api: {
		notFound: () => createErrorResponse(404, "Ressource nicht gefunden"),
		validationError: () => createErrorResponse(400, "Ungültige Eingabe"),
		serverError: () => createErrorResponse(500, "Serverfehler"),
	},
	utils: {
		badRequest: () => createErrorResponse(400, "Bad Request"),
		conflict: () => createErrorResponse(409, "Conflict"),
		rateLimit: () => createErrorResponse(429, "Too many requests"),
	},
};

/**
 * Mocks users API endpoint
 * @param users - Array of users to return
 */
export function mockUsersApiEndpoint(users = []) {
	return mockApiEndpoint("/api/users", "GET", () => users);
}

/**
 * Mocks labels API endpoint
 */
export function mockLabelsApiEndpoint() {
	return mockApiEndpoint("/api/admin/labels", "GET", () => [
		{ id: "events", name: "Events", private: false },
		{ id: "markt", name: "Markt", private: false },
		{ id: "eigentuemerversammlung", name: "Eigentümerversammlung", private: true },
	]);
}

/**
 * Mocks error responses for given endpoint
 * @param endpoint - API endpoint to mock
 * @param error - Error response object
 */
export function mockApiError(endpoint: string, error: { statusCode: number; message: string }) {
	mockApiEndpoint(endpoint, "GET", () => {
		throw createError(error.statusCode, error.message);
	});
}

function createError(statusCode: number, message: string, _data?: any) {
	const error = new Error(message) as any;
	error.statusCode = statusCode;
	return error;
}