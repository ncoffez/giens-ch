import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listDocs, readDoc, resetFakeFirebase, seedDoc } from "../helpers/fakeFirebaseAdmin";
import {
	DOCUMENT_ACTIONS,
	EMPTY_PERMISSION_CONFIG,
	PERMISSION_ROWS,
	canPerform,
	canPerformFolderAction,
	documentDeleteScope,
	folderDeletionBlock,
	migrateLegacyDeletePermission,
	type PermissionClaimSet,
	type SitePermissionConfig,
} from "../../shared/sitePermissions";
import { documentDeleteBlockReason, documentDeleteErrorKey } from "../../app/utils/documentDelete";

/**
 * Issue #35: owners may delete only the documents they uploaded and the
 * folders they created. Deleting everything stays an admin right.
 */

vi.mock("../../server/useFirebaseAdmin", async () => (await import("../helpers/fakeFirebaseAdmin")).fakeFirebaseAdmin);

const currentClaims: { value: PermissionClaimSet } = { value: { uid: "owner-a", owner: true } };

vi.mock("../../server/utils/auth", () => ({
	getUserClaims: vi.fn(async () => currentClaims.value),
	requireSignedIn: vi.fn(async () => currentClaims.value),
}));

interface FakeEvent {
	body?: Record<string, unknown>;
}

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("readBody", async (event: FakeEvent) => JSON.parse(JSON.stringify(event.body ?? {})));

const admin = { uid: "admin-1", admin: true };
const ownerA = { uid: "owner-a", owner: true };
const ownerB = { uid: "owner-b", owner: true };
const reader = { uid: "reader-1", reader: true };

type Handler = (event: FakeEvent) => Promise<any>;

async function route(path: string): Promise<Handler> {
	return (await import(/* @vite-ignore */ path)).default as Handler;
}

async function call(path: string, claims: PermissionClaimSet, body: Record<string, unknown>) {
	currentClaims.value = claims;
	const handler = await route(path);
	return handler({ body });
}

async function refused(promise: Promise<unknown>) {
	try {
		await promise;
	} catch (error: unknown) {
		return error as { statusCode?: number; data?: { reason?: string }; message?: string };
	}
	throw new Error("Expected the request to be refused");
}

function seedFile(id: string, folderId: string | null, uploadedBy?: string) {
	seedDoc("globalFiles", id, {
		id,
		name: `${id}.pdf`,
		type: "application/pdf",
		size: 1,
		folderId,
		uploadedAt: "2026-10-01T00:00:00.000Z",
		...(uploadedBy ? { uploadedBy } : {}),
	});
}

function seedFolder(id: string, parentId: string | null, createdBy?: string) {
	seedDoc("globalFolders", id, {
		id,
		name: id,
		parentId,
		createdAt: "2026-10-01T00:00:00.000Z",
		...(createdBy ? { createdBy } : {}),
	});
}

function readLocale(locale: "de" | "fr") {
	return JSON.parse(readFileSync(`i18n/locales/${locale}.json`, "utf8"));
}

describe("permission matrix row for deleting own items", () => {
	it("lists \"delete own\" as its own row next to the general delete row", () => {
		const keys = PERMISSION_ROWS.map((row) => row.key);
		expect(keys).toContain("documents.deleteOwn");
		expect(keys.indexOf("documents.deleteOwn")).toBe(keys.indexOf("documents.delete") - 1);
		expect(DOCUMENT_ACTIONS).toContain("deleteOwn");
	});

	it("labels both rows in German and French, clearly distinct", () => {
		const de = readLocale("de").admin.permissions;
		const fr = readLocale("fr").admin.permissions;
		expect(de.rows.documents.deleteOwn).toBe("Eigene Dokumente/Ordner löschen");
		expect(de.rows.documents.delete).toBe("Alle Dokumente/Ordner löschen");
		expect(fr.rows.documents.deleteOwn).toBe("Supprimer ses propres documents/dossiers");
		expect(fr.rows.documents.delete).toBe("Supprimer tous les documents/dossiers");
		expect(de.actions.deleteOwn).toBe(de.rows.documents.deleteOwn);
		expect(fr.actions.deleteOwn).toBe(fr.rows.documents.deleteOwn);
	});

	it("has DE and FR messages for refused deletes", () => {
		for (const locale of ["de", "fr"] as const) {
			const errors = readLocale(locale).documents.errors;
			expect(errors.deleteNotOwn, locale).toBeTruthy();
			expect(errors.deleteForeignContent, locale).toBeTruthy();
			expect(errors.deleteForbidden, locale).toBeTruthy();
		}
	});

	it("defaults: owners delete their own items, only admins delete everything", () => {
		expect(canPerform(EMPTY_PERMISSION_CONFIG, ownerA, "documents.deleteOwn")).toBe(true);
		expect(canPerform(EMPTY_PERMISSION_CONFIG, ownerA, "documents.delete")).toBe(false);
		expect(canPerform(EMPTY_PERMISSION_CONFIG, admin, "documents.delete")).toBe(true);
		expect(canPerform(EMPTY_PERMISSION_CONFIG, reader, "documents.deleteOwn")).toBe(false);
		expect(documentDeleteScope(EMPTY_PERMISSION_CONFIG, [], ownerA, null)).toBe("own");
		expect(documentDeleteScope(EMPTY_PERMISSION_CONFIG, [], admin, null)).toBe("all");
		expect(documentDeleteScope(EMPTY_PERMISSION_CONFIG, [], reader, null)).toBe("none");
	});
});

describe("migrating saved permissions from before #35", () => {
	it("moves the owner's old delete right to \"delete own\" and keeps admins on delete-all", () => {
		const legacy: SitePermissionConfig = {
			grants: { "documents.delete": { admin: true, publisher: false, owner: true, reader: false } },
			folders: {},
		};
		const migrated = migrateLegacyDeletePermission(legacy);
		expect(migrated.grants["documents.deleteOwn"]).toEqual({ admin: true, publisher: false, owner: true, reader: false });
		expect(migrated.grants["documents.delete"]).toEqual({ admin: true, publisher: false, owner: false, reader: false });
		expect(canPerform(migrated, ownerA, "documents.delete")).toBe(false);
		expect(canPerform(migrated, ownerA, "documents.deleteOwn")).toBe(true);
		expect(canPerform(migrated, admin, "documents.delete")).toBe(true);
	});

	it("migrates folder overrides the same way", () => {
		const folders = [{ id: "pool", parentId: null }];
		const legacy: SitePermissionConfig = {
			grants: {},
			folders: { pool: { delete: { admin: true, publisher: true, owner: true, reader: false } } },
		};
		const migrated = migrateLegacyDeletePermission(legacy);
		expect(migrated.folders.pool?.deleteOwn).toEqual({ admin: true, publisher: true, owner: true, reader: false });
		expect(migrated.folders.pool?.delete).toEqual({ admin: true, publisher: false, owner: false, reader: false });
		expect(canPerformFolderAction(migrated, folders, ownerA, "pool", "delete")).toBe(false);
		expect(canPerformFolderAction(migrated, folders, ownerA, "pool", "deleteOwn")).toBe(true);
	});

	it("leaves configs alone once they know \"delete own\"", () => {
		const current: SitePermissionConfig = {
			grants: {
				"documents.deleteOwn": { admin: true, publisher: false, owner: true, reader: false },
				"documents.delete": { admin: true, publisher: false, owner: true, reader: false },
			},
			folders: {},
		};
		expect(migrateLegacyDeletePermission(current)).toBe(current);
		expect(canPerform(current, ownerA, "documents.delete")).toBe(true);
	});

	it("keeps an untouched config on the new defaults", () => {
		const migrated = migrateLegacyDeletePermission({ grants: {}, folders: {} });
		expect(migrated).toEqual({ grants: {}, folders: {} });
	});
});

describe("folder deletion check", () => {
	it("needs the folder and everything in it to be the user's own when only \"delete own\" is granted", () => {
		const own = { createdBy: "owner-a" };
		expect(folderDeletionBlock({ scope: "own", claims: ownerA, rootFolder: own, descendantFolders: [own], activeFiles: [{ uploadedBy: "owner-a" }] })).toBeNull();
		expect(folderDeletionBlock({ scope: "own", claims: ownerA, rootFolder: { createdBy: "owner-b" } })).toBe("not-own");
		expect(folderDeletionBlock({ scope: "own", claims: ownerA, rootFolder: {} })).toBe("not-own");
		expect(folderDeletionBlock({ scope: "own", claims: ownerA, rootFolder: own, descendantFolders: [{ createdBy: "owner-b" }] })).toBe("foreign-content");
		expect(folderDeletionBlock({ scope: "own", claims: ownerA, rootFolder: own, activeFiles: [{}] })).toBe("foreign-content");
		expect(folderDeletionBlock({ scope: "all", claims: admin, rootFolder: {}, activeFiles: [{ uploadedBy: "owner-b" }] })).toBeNull();
		expect(folderDeletionBlock({ scope: "none", claims: reader, rootFolder: {} })).toBe("forbidden");
	});
});

describe("delete routes", () => {
	beforeEach(() => {
		resetFakeFirebase();
	});

	it("lets an owner trash their own file but not someone else's", async () => {
		seedFile("mine", null, "owner-a");
		seedFile("theirs", null, "owner-b");

		await expect(call("/server/api/files/delete.post.ts", ownerA, { fileId: "mine" })).resolves.toEqual({ success: true });
		expect(readDoc("globalFiles", "mine")?.deletedAt).toBeTruthy();

		const error = await refused(call("/server/api/files/delete.post.ts", ownerA, { fileId: "theirs" }));
		expect(error.statusCode).toBe(403);
		expect(error.data?.reason).toBe("not-own");
		expect(readDoc("globalFiles", "theirs")?.deletedAt).toBeUndefined();
	});

	it("treats legacy files without uploader as not own; admins can still delete them", async () => {
		seedFile("legacy", null);

		const error = await refused(call("/server/api/files/delete.post.ts", ownerA, { fileId: "legacy" }));
		expect(error.statusCode).toBe(403);
		expect(readDoc("globalFiles", "legacy")?.deletedAt).toBeUndefined();

		await call("/server/api/files/delete.post.ts", admin, { fileId: "legacy" });
		expect(readDoc("globalFiles", "legacy")?.deletedAt).toBeTruthy();
	});

	it("lets admins delete anyone's file and refuses readers", async () => {
		seedFile("theirs", null, "owner-b");
		const error = await refused(call("/server/api/files/delete.post.ts", reader, { fileId: "theirs" }));
		expect(error.statusCode).toBe(403);
		expect(error.data?.reason).toBe("forbidden");

		await call("/server/api/files/delete.post.ts", admin, { fileId: "theirs" });
		expect(readDoc("globalFiles", "theirs")?.deletedAt).toBeTruthy();
	});

	it("lets an owner delete a folder tree that is entirely their own", async () => {
		seedFolder("trip", null, "owner-a");
		seedFolder("trip-photos", "trip", "owner-a");
		seedFile("ticket", "trip", "owner-a");
		seedFile("photo", "trip-photos", "owner-a");

		const result = await call("/server/api/folders/delete.post.ts", ownerA, { folderId: "trip" });
		expect(result).toMatchObject({ success: true, fileCount: 2, folderCount: 1 });
		expect(readDoc("globalFolders", "trip")).toBeUndefined();
		expect(readDoc("globalFolders", "trip-photos")).toBeUndefined();
		expect(readDoc("globalFiles", "photo")?.deletedAt).toBeTruthy();
	});

	it("blocks an owner's folder that contains someone else's items, also in the dry run", async () => {
		seedFolder("shared", null, "owner-a");
		seedFolder("others", "shared", "owner-b");
		seedFile("mine", "shared", "owner-a");
		seedFile("theirs", "others", "owner-a");

		for (const dryRun of [true, false]) {
			const error = await refused(call("/server/api/folders/delete.post.ts", ownerA, { folderId: "shared", dryRun }));
			expect(error.statusCode).toBe(403);
			expect(error.data?.reason).toBe("foreign-content");
		}

		seedFolder("mixed", null, "owner-a");
		seedFile("own-file", "mixed", "owner-a");
		seedFile("foreign-file", "mixed", "owner-b");
		const error = await refused(call("/server/api/folders/delete.post.ts", ownerA, { folderId: "mixed" }));
		expect(error.data?.reason).toBe("foreign-content");

		expect(readDoc("globalFolders", "shared")).toBeTruthy();
		expect(readDoc("globalFolders", "others")).toBeTruthy();
		expect(readDoc("globalFolders", "mixed")).toBeTruthy();
		expect(listDocs("globalFiles").every((file) => !file.deletedAt)).toBe(true);
	});

	it("refuses an owner deleting someone else's or a legacy folder; admins may", async () => {
		seedFolder("theirs", null, "owner-b");
		seedFolder("legacy", null);

		for (const folderId of ["theirs", "legacy"]) {
			const error = await refused(call("/server/api/folders/delete.post.ts", ownerA, { folderId }));
			expect(error.statusCode, folderId).toBe(403);
			expect(error.data?.reason, folderId).toBe("not-own");
		}

		seedFile("inside", "legacy", "owner-b");
		await call("/server/api/folders/delete.post.ts", admin, { folderId: "legacy" });
		await call("/server/api/folders/delete.post.ts", admin, { folderId: "theirs" });
		expect(readDoc("globalFolders", "legacy")).toBeUndefined();
		expect(readDoc("globalFolders", "theirs")).toBeUndefined();
		expect(readDoc("globalFiles", "inside")?.deletedAt).toBeTruthy();
	});

	it("applies the migration to a stored pre-#35 config", async () => {
		seedDoc("sitePermissions", "config", {
			grants: { "documents.delete": { admin: true, publisher: false, owner: true, reader: false } },
			folders: {},
		});
		seedFile("theirs", null, "owner-b");
		seedFile("mine", null, "owner-a");

		const error = await refused(call("/server/api/files/delete.post.ts", ownerA, { fileId: "theirs" }));
		expect(error.data?.reason).toBe("not-own");
		await call("/server/api/files/delete.post.ts", ownerA, { fileId: "mine" });
		expect(readDoc("globalFiles", "mine")?.deletedAt).toBeTruthy();
	});

	it("still lets an admin grant owners delete-all explicitly", async () => {
		seedDoc("sitePermissions", "config", {
			grants: {
				"documents.deleteOwn": { admin: true, publisher: false, owner: true, reader: false },
				"documents.delete": { admin: true, publisher: false, owner: true, reader: false },
			},
			folders: {},
		});
		seedFile("theirs", null, "owner-b");
		await call("/server/api/files/delete.post.ts", ownerA, { fileId: "theirs" });
		expect(readDoc("globalFiles", "theirs")?.deletedAt).toBeTruthy();
	});

	it("records the creator on new folders", async () => {
		const folder = await call("/server/api/folders/create.post.ts", ownerB, { name: "Neu", parentId: null });
		expect(readDoc("globalFolders", folder.id)?.createdBy).toBe("owner-b");
	});
});

describe("refused delete in the browser", () => {
	it("maps 403 reasons to translated messages", () => {
		const fetchError = (reason?: string) => ({ statusCode: 403, data: { message: "x", data: reason ? { reason } : undefined } });
		expect(documentDeleteErrorKey(fetchError("not-own"))).toBe("documents.errors.deleteNotOwn");
		expect(documentDeleteErrorKey(fetchError("foreign-content"))).toBe("documents.errors.deleteForeignContent");
		expect(documentDeleteErrorKey(fetchError())).toBe("documents.errors.deleteForbidden");
		expect(documentDeleteBlockReason({ statusCode: 500 })).toBeNull();
		expect(documentDeleteErrorKey(new Error("offline"))).toBeNull();
	});

	it("hides delete actions the server says the user cannot use", () => {
		const page = readFileSync("app/pages/documents/index.vue", "utf8");
		expect(page).toContain("file.canDelete ?? currentActions.value.delete");
		expect(page).toContain("folder.canDelete ?? !!folder.actions?.delete");
		expect(page).toContain("documentDeleteErrorKey");
		const list = readFileSync("server/api/files/index.post.ts", "utf8");
		expect(list).toContain("canDelete: canDeleteDocumentItem(fileDeleteScope, claims, data.uploadedBy)");
	});
});
