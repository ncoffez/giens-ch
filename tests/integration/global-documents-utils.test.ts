import { describe, expect, it, vi } from "vitest";

vi.mock("../../server/useFirebaseAdmin", () => ({
	auth: {},
	db: {},
	storage: {},
}));

import {
	canDeleteGlobalFile,
	canDeleteGlobalFolder,
	canManageGlobalDocuments,
	getGlobalFolderDeletionError,
} from "../../server/utils/globalDocuments";

describe("global document permissions", () => {
	it("allows owners to manage global documents", () => {
		expect(canManageGlobalDocuments({ owner: true, admin: false, uid: "owner-1" })).toBe(true);
		expect(canManageGlobalDocuments({ owner: false, admin: true, uid: "admin-1" })).toBe(true);
		expect(canManageGlobalDocuments({ owner: false, admin: false, uid: "reader-1" })).toBe(false);
	});

	it("only allows deleting files uploaded by the current owner", () => {
		expect(canDeleteGlobalFile({ owner: true, uid: "owner-1" }, { uploadedBy: "owner-1" })).toBe(true);
		expect(canDeleteGlobalFile({ owner: true, uid: "owner-1" }, { uploadedBy: "owner-2" })).toBe(false);
		expect(canDeleteGlobalFile({ admin: true, uid: "admin-1" }, { uploadedBy: "owner-2" })).toBe(true);
	});

	it("only allows deleting folders created by the current owner", () => {
		expect(canDeleteGlobalFolder({ owner: true, uid: "owner-1" }, { createdBy: "owner-1" })).toBe(true);
		expect(canDeleteGlobalFolder({ owner: true, uid: "owner-1" }, { createdBy: "owner-2" })).toBe(false);
		expect(canDeleteGlobalFolder({ admin: true, uid: "admin-1" }, { createdBy: "owner-2" })).toBe(true);
	});

	it("blocks owner folder deletion when nested files belong to someone else", () => {
		const error = getGlobalFolderDeletionError({
			claims: { owner: true, uid: "owner-1" },
			rootFolder: { createdBy: "owner-1" },
			descendantFolders: [{ createdBy: "owner-1" }],
			activeFiles: [{ uploadedBy: "owner-2" }],
		});

		expect(error).toBe("You can only delete folders containing your own files");
	});

	it("allows owner folder deletion when the whole tree belongs to them", () => {
		const error = getGlobalFolderDeletionError({
			claims: { owner: true, uid: "owner-1" },
			rootFolder: { createdBy: "owner-1" },
			descendantFolders: [{ createdBy: "owner-1" }, { createdBy: "owner-1" }],
			activeFiles: [{ uploadedBy: "owner-1" }, { uploadedBy: "owner-1" }],
		});

		expect(error).toBeNull();
	});
});
