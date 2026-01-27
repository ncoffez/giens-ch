export type ApiError = {
	statusCode: number;
	message: string;
	data?: any;
};

export function createApiError(statusCode: number, message: string, data?: any): ApiError {
	return { statusCode, message, data };
}

export function isApiError(error: any): error is ApiError {
	return error && typeof error.statusCode === "number" && typeof error.message === "string";
}

export function handleApiError(error: any): ApiError {
	if (isApiError(error)) {
		return error;
	}

	if (error?.statusCode && error?.message) {
		return {
			statusCode: error.statusCode,
			message: error.message,
			data: error.data,
		};
	}

	// Firebase auth errors
	if (error?.code) {
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
			statusCode: error.code === "permission-denied" ? 403 : 400,
			message: codeToMessage[error.code] || error.message || "Ein Fehler ist aufgetreten",
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
	return {
		statusCode: 500,
		message: error?.message || "Ein unerwarteter Fehler ist aufgetreten",
		data: error,
	};
}

export function safeJsonParse<T>(value: string, fallback: T): T {
	try {
		return JSON.parse(value) as T;
	} catch {
		return fallback;
	}
}