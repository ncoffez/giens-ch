import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ADMIN_API_DIR = "server/api/admin";

function adminApiFiles() {
	return readdirSync(ADMIN_API_DIR, { recursive: true })
		.filter((name) => String(name).endsWith(".ts"))
		.map((name) => join(ADMIN_API_DIR, String(name)));
}

describe("admin API auth contract", () => {
	it("keeps every admin route behind an auth check", () => {
		const files = adminApiFiles();
		expect(files.length).toBeGreaterThan(0);

		for (const file of files) {
			const source = readFileSync(file, "utf8");
			expect(source, file).toMatch(/requireAdmin|requireSignedIn|getUserClaims|verifyIdToken/);
		}
	});

	it("requires admin on every admin route except bootstrap", () => {
		for (const file of adminApiFiles()) {
			const source = readFileSync(file, "utf8");
			if (file.endsWith("bootstrap-first-admin.post.ts")) {
				expect(source).toContain("bootstrapSecretMatches");
				continue;
			}
			expect(source, file).toMatch(/requireAdmin|claims\.admin|decodedToken\.admin/);
		}
	});

	it("does not resurrect deleted unauthenticated admin/public APIs", () => {
		expect(existsSync("server/api/admin/maintenance.get.ts")).toBe(false);
		expect(existsSync("server/api/hello.ts")).toBe(false);
		expect(existsSync("server/api/labels.ts")).toBe(false);
		expect(existsSync("server/api/authors.ts")).toBe(false);
	});

	it("does not spread Firebase Auth UserRecord onto /api/users", () => {
		const source = readFileSync("server/api/users.ts", "utf8");

		expect(source).toContain("toAdminUserListItem");
		expect(source).not.toMatch(/\.\.\.\s*user\b/);
		expect(source).not.toContain("passwordHash");
	});
});
