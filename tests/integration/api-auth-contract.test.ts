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
		expect(existsSync("server/api/admin/labels.get.ts")).toBe(false);
		expect(existsSync("server/api/admin/labels.post.ts")).toBe(false);
		expect(existsSync("server/api/admin/labels")).toBe(false);
		expect(existsSync("app/pages/admin/labels.vue")).toBe(false);
	});

	it("does not spread Firebase Auth UserRecord onto /api/users", () => {
		const source = readFileSync("server/api/users.ts", "utf8");

		expect(source).toContain("toAdminUserListItem");
		expect(source).not.toMatch(/\.\.\.\s*user\b/);
		expect(source).not.toContain("passwordHash");
	});

	it("uses requireAdmin for settings and public-page content writes", () => {
		expect(readFileSync("server/api/settings.update.ts", "utf8")).toContain("requireAdmin");
		expect(readFileSync("server/api/content/[id].post.ts", "utf8")).toContain("requireAdmin");
		expect(existsSync("server/api/admin/homes/migrate-multi-owner.post.ts")).toBe(false);
	});

	it("keeps memoriam reads owner-only and writes admin-only", () => {
		expect(readFileSync("server/api/memoriam.get.ts", "utf8")).toContain("requireOwnerOrAdmin");
		expect(readFileSync("server/api/admin/memoriam.get.ts", "utf8")).toContain("requireAdmin");
		expect(readFileSync("server/api/admin/memoriam.post.ts", "utf8")).toContain("requireAdmin");
		expect(readFileSync("server/api/admin/memoriam/reorder.post.ts", "utf8")).toContain("requireAdmin");
		expect(readFileSync("server/api/admin/memoriam/[id]/update.post.ts", "utf8")).toContain("requireAdmin");
		expect(readFileSync("server/api/admin/memoriam/[id]/delete.post.ts", "utf8")).toContain("requireAdmin");
		expect(readFileSync("server/api/admin/memoriam/[id]/photos/upload.post.ts", "utf8")).toContain("requireAdmin");
		expect(readFileSync("server/api/admin/memoriam/[id]/photos/delete.post.ts", "utf8")).toContain("requireAdmin");
	});
});
