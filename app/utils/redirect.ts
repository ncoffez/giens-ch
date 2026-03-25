export function sanitizeRedirectPath(input: unknown, fallback = "/"): string {
	if (typeof input !== "string") return fallback;
	if (!input.startsWith("/") || input.startsWith("//")) return fallback;
	return input;
}
