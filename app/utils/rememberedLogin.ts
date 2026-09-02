export const REMEMBERED_EMAIL_KEY = "giens:auth:remembered-email";
export const REMEMBER_ME_KEY = "giens:auth:remember-me";

export interface RememberedLogin {
	email: string;
	rememberMe: boolean;
}

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem" | "removeItem">;

/**
 * Reads the remembered login from storage. Storage access throws in Safari's
 * private mode and when cookies are blocked, so every access is guarded and
 * falls back to "remember me on, nothing prefilled".
 */
export function readRememberedLogin(storage: ReadableStorage | null | undefined): RememberedLogin {
	if (!storage) return { email: "", rememberMe: true };

	try {
		const rememberMeRaw = storage.getItem(REMEMBER_ME_KEY);
		const rememberMe = rememberMeRaw === null ? true : rememberMeRaw === "true";

		return {
			email: rememberMe ? (storage.getItem(REMEMBERED_EMAIL_KEY) || "") : "",
			rememberMe,
		};
	} catch {
		return { email: "", rememberMe: true };
	}
}

/**
 * Stores the choice, and the email only when the user asked to be remembered.
 * Turning the option off clears any previously stored address.
 */
export function persistRememberedLogin(
	storage: WritableStorage | null | undefined,
	input: { email?: string; rememberMe: boolean },
): void {
	if (!storage) return;

	try {
		storage.setItem(REMEMBER_ME_KEY, input.rememberMe ? "true" : "false");

		const email = (input.email || "").trim();
		if (input.rememberMe && email) {
			storage.setItem(REMEMBERED_EMAIL_KEY, email);
		} else {
			storage.removeItem(REMEMBERED_EMAIL_KEY);
		}
	} catch {
		// Storage is unavailable; the session still works, it just is not remembered.
	}
}
