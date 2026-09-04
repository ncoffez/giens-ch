import { describe, expect, it } from "vitest";
import { toAdminUserListItem } from "../../server/utils/adminUsers";

describe("toAdminUserListItem", () => {
	it("returns only the admin-UI fields and drops Auth secrets", () => {
		const item = toAdminUserListItem({
			uid: "user-1",
			email: "owner@example.com",
			displayName: "Owner",
			photoURL: "https://example.com/a.png",
			emailVerified: true,
			disabled: false,
			customClaims: { admin: true, publisher: false, extra: "nope" },
			passwordHash: "should-not-leak",
			passwordSalt: "should-not-leak",
			providerData: [{ uid: "google.com" }],
			tokensValidAfterTime: "2020-01-01",
			metadata: { lastSignInTime: "now" },
		} as never, { displayName: "From Firestore" });

		expect(item).toEqual({
			uid: "user-1",
			email: "owner@example.com",
			displayName: "From Firestore",
			photoURL: "https://example.com/a.png",
			emailVerified: true,
			disabled: false,
			admin: true,
			publisher: false,
			owner: false,
			reader: false,
			customClaims: {
				admin: true,
				publisher: false,
				owner: false,
				reader: false,
			},
		});
		expect(JSON.stringify(item)).not.toContain("should-not-leak");
		expect(JSON.stringify(item)).not.toContain("google.com");
		expect(JSON.stringify(item)).not.toContain("extra");
	});

	it("falls back to the Auth profile when Firestore has no overlay", () => {
		const item = toAdminUserListItem({
			uid: "user-2",
			email: "reader@example.com",
			displayName: "From Auth",
			emailVerified: false,
			disabled: true,
		});

		expect(item.displayName).toBe("From Auth");
		expect(item.admin).toBe(false);
		expect(item.customClaims).toEqual({
			admin: false,
			publisher: false,
			owner: false,
			reader: false,
		});
	});
});
