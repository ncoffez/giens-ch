import { describe, expect, it } from "vitest";
import { sortAdminUsers, toggleSortDirection } from "../../app/utils/adminUserSort";
import {
	instructionEditorLocale,
	instructionHtmlHasText,
	shouldAutoTranslateInstructions,
} from "../../app/utils/instructionLocale";

describe("admin user name sort", () => {
	const users = [
		{ displayName: "Zoe Keller", email: "zoe@example.com" },
		{ displayName: "", email: "aaron@example.com" },
		{ displayName: "Müller", email: "mueller@example.com" },
	];

	it("sorts by display name, then email, in German order", () => {
		expect(sortAdminUsers(users, "name", "asc").map((user) => user.email)).toEqual([
			"aaron@example.com",
			"mueller@example.com",
			"zoe@example.com",
		]);
	});

	it("reverses the same order", () => {
		expect(sortAdminUsers(users, "name", "desc").map((user) => user.email)).toEqual([
			"zoe@example.com",
			"mueller@example.com",
			"aaron@example.com",
		]);
		expect(toggleSortDirection("asc")).toBe("desc");
		expect(toggleSortDirection("desc")).toBe("asc");
	});

	it("sorts by the strongest role and keeps names alphabetical inside a role", () => {
		const withRoles = [
			{ displayName: "Zoe", email: "zoe@example.com", customClaims: { reader: true } },
			{ displayName: "Anna", email: "anna@example.com", customClaims: { admin: true, owner: true } },
			{ displayName: "Ben", email: "ben@example.com", customClaims: {} },
			{ displayName: "Mia", email: "mia@example.com", customClaims: { admin: true } },
		];

		expect(sortAdminUsers(withRoles, "role", "asc").map((user) => user.email)).toEqual([
			"anna@example.com",
			"mia@example.com",
			"zoe@example.com",
			"ben@example.com",
		]);
		expect(sortAdminUsers(withRoles, "role", "desc").map((user) => user.email)).toEqual([
			"ben@example.com",
			"zoe@example.com",
			"anna@example.com",
			"mia@example.com",
		]);
	});

	it("sorts active accounts before deactivated ones", () => {
		const withStatus = [
			{ displayName: "Zoe", email: "zoe@example.com", disabled: false },
			{ displayName: "Anna", email: "anna@example.com", disabled: true },
			{ displayName: "Ben", email: "ben@example.com", disabled: false },
		];

		expect(sortAdminUsers(withStatus, "status", "asc").map((user) => user.email)).toEqual([
			"ben@example.com",
			"zoe@example.com",
			"anna@example.com",
		]);
		expect(sortAdminUsers(withStatus, "status", "desc").map((user) => user.email)).toEqual([
			"anna@example.com",
			"ben@example.com",
			"zoe@example.com",
		]);
	});
});

describe("instruction editor locale", () => {
	it("follows the site language", () => {
		expect(instructionEditorLocale("fr")).toBe("fr");
		expect(instructionEditorLocale("de")).toBe("de");
		expect(instructionEditorLocale("en")).toBe("de");
	});

	it("treats empty markup as missing text", () => {
		expect(instructionHtmlHasText("<p></p>")).toBe(false);
		expect(instructionHtmlHasText("<p>Schlüssel</p>")).toBe(true);
	});

	it("translates once when the viewed language is still empty", () => {
		const input = {
			loading: false,
			saving: false,
			alreadyAttempted: false,
			viewingLocale: "fr" as const,
			sourceLocale: "de" as const,
			sourceHtml: "<p>Der Schlüssel liegt im Schrank.</p>",
			targetHtml: "",
		};

		expect(shouldAutoTranslateInstructions(input)).toBe(true);
		expect(shouldAutoTranslateInstructions({ ...input, viewingLocale: "de" })).toBe(false);
		expect(shouldAutoTranslateInstructions({ ...input, alreadyAttempted: true })).toBe(false);
		expect(shouldAutoTranslateInstructions({ ...input, targetHtml: "<p>La clé</p>" })).toBe(false);
		expect(shouldAutoTranslateInstructions({ ...input, loading: true })).toBe(false);
	});
});
