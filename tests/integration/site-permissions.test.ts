import { describe, expect, it } from "vitest";
import {
	EMPTY_PERMISSION_CONFIG,
	canAccessDocuments,
	canEditHomeSection,
	canPerform,
	canPerformFolderAction,
	permissionAuditLines,
	resolvedGrants,
	sanitizePermissionConfig,
	type SitePermissionConfig,
} from "../../shared/sitePermissions";

const admin = { admin: true, uid: "admin-1" };
const publisher = { publisher: true, uid: "publisher-1" };
const owner = { owner: true, uid: "owner-1" };
const reader = { reader: true, uid: "reader-1" };

describe("site permission matrix", () => {
	it("starts from the stakeholder matrix", () => {
		expect(canPerform(EMPTY_PERMISSION_CONFIG, admin, "page.home.edit")).toBe(true);
		expect(canPerform(EMPTY_PERMISSION_CONFIG, publisher, "page.travel.edit")).toBe(false);
		expect(canPerform(EMPTY_PERMISSION_CONFIG, publisher, "documents.open")).toBe(false);
		expect(canPerform(EMPTY_PERMISSION_CONFIG, reader, "documents.open")).toBe(true);
		expect(canPerform(EMPTY_PERMISSION_CONFIG, owner, "documents.delete")).toBe(true);
		expect(canPerform(EMPTY_PERMISSION_CONFIG, owner, "documents.rename")).toBe(false);
		expect(canPerform(EMPTY_PERMISSION_CONFIG, reader, "documents.upload")).toBe(false);
		expect(canPerform(EMPTY_PERMISSION_CONFIG, owner, "home.wifi.edit")).toBe(true);
		expect(canPerform(EMPTY_PERMISSION_CONFIG, reader, "memoriam.view")).toBe(false);
		expect(canPerform(EMPTY_PERMISSION_CONFIG, owner, "memoriam.view")).toBe(true);
		expect(canPerform(EMPTY_PERMISSION_CONFIG, owner, "memoriam.manage")).toBe(false);
	});

	it("keeps user management and the permission page admin-only", () => {
		const config: SitePermissionConfig = {
			grants: {
				"admin.users.manage": { admin: false, publisher: true, owner: true, reader: true },
				"admin.permissions.manage": { admin: false, publisher: true, owner: false, reader: false },
			},
			folders: {},
		};

		expect(resolvedGrants(config, "admin.users.manage").admin).toBe(true);
		expect(canPerform(config, publisher, "admin.users.manage")).toBe(false);
		expect(canPerform(config, admin, "admin.permissions.manage")).toBe(true);
		expect(sanitizePermissionConfig(config, new Set()).grants["admin.users.manage"]).toBeUndefined();
	});

	it("accepts an admin change for an editable row", () => {
		const config = sanitizePermissionConfig({
			grants: {
				"page.home.edit": { admin: true, publisher: true, owner: false, reader: false },
			},
		}, new Set());

		expect(canPerform(config, publisher, "page.home.edit")).toBe(true);
		expect(canPerform(config, reader, "page.home.edit")).toBe(false);
	});

	it("lets a top-level folder be more open than the document root", () => {
		const config = sanitizePermissionConfig({
			grants: {
				"documents.open": { admin: true, publisher: false, owner: true, reader: false },
			},
			folders: {
				top: {
					open: { admin: true, publisher: false, owner: true, reader: true },
				},
			},
		}, new Set(["top"]));
		const folders = [{ id: "top", parentId: null }];

		expect(canPerformFolderAction(config, folders, reader, null, "open")).toBe(false);
		expect(canPerformFolderAction(config, folders, reader, "top", "open")).toBe(true);
		expect(canAccessDocuments(config, folders, reader)).toBe(true);
	});

	it("blocks a child that is marked more open than its parent", () => {
		const config: SitePermissionConfig = {
			grants: {},
			folders: {
				parent: { open: { admin: true, publisher: false, owner: true, reader: false } },
				child: { open: { admin: true, publisher: false, owner: true, reader: true } },
			},
		};
		const folders = [
			{ id: "parent", parentId: null },
			{ id: "child", parentId: "parent" },
		];

		expect(canPerformFolderAction(config, folders, reader, "child", "open")).toBe(false);
		expect(canPerformFolderAction(config, folders, reader, "child", "upload")).toBe(false);
		expect(canPerformFolderAction(config, folders, owner, "child", "open")).toBe(true);
	});

	it("inherits an action from the parent folder when the child has no own row", () => {
		const config: SitePermissionConfig = {
			grants: {},
			folders: {
				parent: {
					open: { admin: true, publisher: true, owner: true, reader: true },
					upload: { admin: true, publisher: true, owner: false, reader: false },
				},
			},
		};
		const folders = [
			{ id: "parent", parentId: null },
			{ id: "child", parentId: "parent" },
		];

		expect(canPerformFolderAction(config, folders, publisher, "child", "upload")).toBe(true);
		expect(canPerformFolderAction(config, folders, reader, "child", "upload")).toBe(false);
	});

	it("keeps house ownership separate from the owner role", () => {
		expect(canEditHomeSection(EMPTY_PERMISSION_CONFIG, admin, false, "home.photos.upload")).toBe(true);
		expect(canEditHomeSection(EMPTY_PERMISSION_CONFIG, owner, true, "home.photos.upload")).toBe(true);
		expect(canEditHomeSection(EMPTY_PERMISSION_CONFIG, owner, false, "home.photos.upload")).toBe(false);
		expect(canEditHomeSection(EMPTY_PERMISSION_CONFIG, reader, true, "home.files.upload")).toBe(false);
	});

	it("records a grant change for the audit log", () => {
		const next = sanitizePermissionConfig({
			grants: {
				"page.entdecken.edit": { admin: true, publisher: true, owner: false, reader: false },
			},
		}, new Set());

		expect(permissionAuditLines(EMPTY_PERMISSION_CONFIG, next, [])).toEqual([
			expect.objectContaining({ key: "page.entdecken.edit" }),
		]);
	});
});
