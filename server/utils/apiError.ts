export interface ApiError {
	statusCode: number;
	message: string;
	data?: unknown;
}

export function createApiError(statusCode: number, message: string, data?: unknown): ApiError {
	return { statusCode, message, data };
}

export function isApiError(error: unknown): error is ApiError {
	return (
		typeof error === "object" &&
		error !== null &&
		"statusCode" in error &&
		typeof (error as Record<string, unknown>).statusCode === "number" &&
		"message" in error &&
		typeof (error as Record<string, unknown>).message === "string"
	);
}

export function handleApiError(error: unknown): ApiError {
	if (isApiError(error)) {
		return error;
	}

	if (
		typeof error === "object" &&
		error !== null &&
		"statusCode" in error &&
		"message" in error
	) {
		const err = error as Record<string, unknown>;
		return {
			statusCode: typeof err.statusCode === "number" ? err.statusCode : 500,
			message: typeof err.message === "string" ? err.message : "Ein Fehler ist aufgetreten",
			data: err.data,
		};
	}

	// Firebase auth errors
	if (typeof error === "object" && error !== null && "code" in error) {
		const err = error as Record<string, unknown>;
		const code = String(err.code);
		const codeToMessage: Record<string, string> = {
			"auth/user-not-found": "Benutzer nicht gefunden",
			"auth/invalid-credential": "Ungültige Anmeldedaten",
			"auth/too-many-requests": "Zu viele Versuche, bitte versuchen Sie es später erneut",
			"auth/email-already-in-use": "Diese E-Mail ist bereits registriert",
			"auth/weak-password": "Passwort muss mindestens 6 Zeichen lang sein",
			"permission-denied": "Zugriff verweigert",
			"unauthenticated": "Nicht authentifiziert",
			"not-found": "Ressource nicht gefunden",
		};
		return {
			statusCode: code === "permission-denied" ? 403 : 400,
			message: codeToMessage[code] || (typeof err.message === "string" ? err.message : "Ein Fehler ist aufgetreten"),
		};
	}

	// Network errors
	if (error instanceof TypeError && error.message.includes("fetch")) {
		return {
			statusCode: 503,
			message: "Netzwerkfehler: Die Verbindung konnte nicht hergestellt werden",
		};
	}

	// Default error
	const message = error instanceof Error ? error.message : "Ein unerwarteter Fehler ist aufgetreten";
	return {
		statusCode: 500,
		message,
		data: error,
	};
}

export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	if (isApiError(error)) return error.message;
	if (typeof error === "object" && error !== null && "message" in error) {
		const msg = (error as Record<string, unknown>).message;
		return typeof msg === "string" ? msg : "Ein Fehler ist aufgetreten";
	}
	return "Ein Fehler ist aufgetreten";
}

export function safeJsonParse<T>(value: string, fallback: T): T {
	try {
		return JSON.parse(value) as T;
	} catch {
		return fallback;
	}
}