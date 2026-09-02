import { beforeEach, describe, expect, it } from "vitest";
import {
	REMEMBERED_EMAIL_KEY,
	REMEMBER_ME_KEY,
	persistRememberedLogin,
	readRememberedLogin,
} from "../../app/utils/rememberedLogin";

function createStorage(initial: Record<string, string> = {}) {
	const data = new Map(Object.entries(initial));

	return {
		data,
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => { data.set(key, value); },
		removeItem: (key: string) => { data.delete(key); },
	};
}

function createBrokenStorage() {
	const boom = () => { throw new Error("storage unavailable"); };
	return { getItem: boom, setItem: boom, removeItem: boom };
}

describe("remembered login", () => {
	let storage: ReturnType<typeof createStorage>;

	beforeEach(() => {
		storage = createStorage();
	});

	it("defaults to remembering with nothing prefilled", () => {
		expect(readRememberedLogin(storage)).toEqual({ email: "", rememberMe: true });
	});

	it("returns the stored email when remembering is enabled", () => {
		storage = createStorage({
			[REMEMBER_ME_KEY]: "true",
			[REMEMBERED_EMAIL_KEY]: "gast@giens.ch",
		});

		expect(readRememberedLogin(storage)).toEqual({ email: "gast@giens.ch", rememberMe: true });
	});

	it("ignores a stored email once remembering is disabled", () => {
		storage = createStorage({
			[REMEMBER_ME_KEY]: "false",
			[REMEMBERED_EMAIL_KEY]: "gast@giens.ch",
		});

		expect(readRememberedLogin(storage)).toEqual({ email: "", rememberMe: false });
	});

	it("persists the email when remembering", () => {
		persistRememberedLogin(storage, { email: " gast@giens.ch ", rememberMe: true });

		expect(storage.data.get(REMEMBER_ME_KEY)).toBe("true");
		expect(storage.data.get(REMEMBERED_EMAIL_KEY)).toBe("gast@giens.ch");
	});

	it("clears the stored email when remembering is switched off", () => {
		storage = createStorage({ [REMEMBERED_EMAIL_KEY]: "gast@giens.ch" });

		persistRememberedLogin(storage, { email: "gast@giens.ch", rememberMe: false });

		expect(storage.data.has(REMEMBERED_EMAIL_KEY)).toBe(false);
		expect(storage.data.get(REMEMBER_ME_KEY)).toBe("false");
	});

	it("does not store an empty email", () => {
		persistRememberedLogin(storage, { email: "   ", rememberMe: true });

		expect(storage.data.has(REMEMBERED_EMAIL_KEY)).toBe(false);
	});

	it("survives storage that throws (private mode)", () => {
		const broken = createBrokenStorage();

		expect(readRememberedLogin(broken)).toEqual({ email: "", rememberMe: true });
		expect(() => persistRememberedLogin(broken, { email: "a@b.ch", rememberMe: true })).not.toThrow();
	});

	it("handles a missing storage object", () => {
		expect(readRememberedLogin(null)).toEqual({ email: "", rememberMe: true });
		expect(() => persistRememberedLogin(null, { rememberMe: true })).not.toThrow();
	});
});
