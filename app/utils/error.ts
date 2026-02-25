export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	if (typeof error === "object" && error !== null) {
		const err = error as Record<string, unknown>;
		if (typeof err.message === "string") return err.message;
		if (err.data && typeof err.data === "object" && err.data !== null) {
			const data = err.data as Record<string, unknown>;
			if (typeof data.message === "string") return data.message;
		}
	}
	return "Ein Fehler ist aufgetreten";
}

export function getFetchError(error: unknown): string {
	if (typeof error === "object" && error !== null) {
		const err = error as Record<string, unknown>;
		if (err.data && typeof err.data === "object" && err.data !== null) {
			const data = err.data as Record<string, unknown>;
			if (typeof data.message === "string") return data.message;
		}
		if (typeof err.message === "string") return err.message;
	}
	if (error instanceof Error) return error.message;
	return "Ein Fehler ist aufgetreten";
}
