import { describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("../../server/useFirebaseAdmin", () => ({
	auth: {},
	db: {},
	storage: {},
}));

const {
	canAdminGlobalDocuments,
	canManageHomeFiles,
	canReadGlobalDocuments,
} = await import("../../server/utils/fileAccess");
const {
	canDeleteGlobalFile,
	canManageGlobalDocuments,
} = await import("../../server/utils/globalDocuments");

const admin = { uid: "admin-1", admin: true };
const ownerA = { uid: "owner-a", owner: true };
const ownerB = { uid: "owner-b", owner: true };
const reader = { uid: "reader-1", reader: true };
const publisher = { uid: "publisher-1", publisher: true };
const signedIn = { uid: "user-1" };
const homeA = { ownerIds: ["owner-a"] };
const homeB = { ownerIds: ["owner-b", "admin-1"] };

function walkTs(dir: string) {
	return readdirSync(dir, { recursive: true })
		.filter((name) => String(name).endsWith(".ts"))
		.map((name) => join(dir, String(name)));
}

describe("global file access", () => {
	it("lets any private-access role read, but not a signed-in user without a role", () => {
		expect(canReadGlobalDocuments(admin)).toBe(true);
		expect(canReadGlobalDocuments(ownerA)).toBe(true);
		expect(canReadGlobalDocuments(reader)).toBe(true);
		expect(canReadGlobalDocuments(publisher)).toBe(true);
		expect(canReadGlobalDocuments(signedIn)).toBe(false);
		expect(canReadGlobalDocuments(null)).toBe(false);
	});

	it("lets owners upload, but not readers", () => {
		expect(canManageGlobalDocuments(admin)).toBe(true);
		expect(canManageGlobalDocuments(ownerA)).toBe(true);
		expect(canManageGlobalDocuments(reader)).toBe(false);
		expect(canManageGlobalDocuments(publisher)).toBe(false);
	});

	it("lets owners delete only their own files; admins delete anyone's", () => {
		expect(canDeleteGlobalFile(ownerA, { uploadedBy: "owner-a" })).toBe(true);
		expect(canDeleteGlobalFile(ownerA, { uploadedBy: "owner-b" })).toBe(false);
		expect(canDeleteGlobalFile(admin, { uploadedBy: "owner-b" })).toBe(true);
		expect(canDeleteGlobalFile(reader, { uploadedBy: "owner-a" })).toBe(false);
	});

	it("reserves rename, move, trash and restore for admins", () => {
		expect(canAdminGlobalDocuments(admin)).toBe(true);
		expect(canAdminGlobalDocuments(ownerA)).toBe(false);
		expect(canAdminGlobalDocuments(reader)).toBe(false);
		expect(canAdminGlobalDocuments(null)).toBe(false);
	});
});

describe("home file access", () => {
	it("allows only users listed on that home, not the global owner or admin claim", () => {
		expect(canManageHomeFiles(ownerA, homeA)).toBe(true);
		expect(canManageHomeFiles(ownerB, homeA)).toBe(false);
		expect(canManageHomeFiles(admin, homeA)).toBe(false);
		expect(canManageHomeFiles(admin, homeB)).toBe(true);
		expect(canManageHomeFiles(reader, homeA)).toBe(false);
		expect(canManageHomeFiles(null, homeA)).toBe(false);
		expect(canManageHomeFiles(ownerA, null)).toBe(false);
	});
});

describe("file route auth contract", () => {
	it("keeps global structural mutations admin-only", () => {
		const files = [
			"server/api/files/rename.post.ts",
			"server/api/files/move.post.ts",
			"server/api/files/restore.post.ts",
			"server/api/files/trash.get.ts",
			"server/api/files/permanent-delete.post.ts",
			"server/api/folders/rename.post.ts",
			"server/api/folders/move.post.ts",
		];

		for (const file of files) {
			expect(readFileSync(file, "utf8"), file).toContain("canAdminGlobalDocuments");
			expect(readFileSync(file, "utf8"), file).not.toContain("canManageGlobalDocuments");
		}
	});

	it("lets owners upload and delete their own global files", () => {
		expect(readFileSync("server/api/files/upload.post.ts", "utf8")).toContain("canManageGlobalDocuments");
		expect(readFileSync("server/api/files/delete.post.ts", "utf8")).toContain("canDeleteGlobalFile");
		expect(readFileSync("server/api/folders/create.post.ts", "utf8")).toContain("canManageGlobalDocuments");
		expect(readFileSync("server/api/folders/delete.post.ts", "utf8")).toContain("canDeleteGlobalFolder");
	});

	it("does not treat an admin claim as ownership of another home's files", () => {
		const homeFileRoutes = walkTs("server/api/homes").filter((file) => file.includes("[id]/files/"));

		expect(homeFileRoutes.length).toBeGreaterThan(0);
		for (const file of homeFileRoutes) {
			const source = readFileSync(file, "utf8");
			expect(source, file).toContain("canManageHomeFiles");
			expect(source, file).not.toMatch(/claims\.admin\s*\|\|/);
			expect(source, file).not.toMatch(/if\s*\(\s*claims\.admin\s*\)/);
		}
	});

	it("keeps share-link downloads off the owner/admin matrix", () => {
		const source = readFileSync("server/api/homes/share/[token]/files/download.get.ts", "utf8");

		expect(source).toContain("getShareLink");
		expect(source).not.toContain("canManageHomeFiles");
		expect(source).not.toContain("claims.admin");
	});
});
