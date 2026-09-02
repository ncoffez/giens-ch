import { describe, expect, it } from "vitest";
import type { Home } from "../../types";
import {
	MAX_HOME_FILE_NAME_LENGTH,
	renameHomeFileInHome,
	sanitizeHomeFileName,
} from "../../server/utils/homeFiles";

function buildHome(): Home {
	return {
		id: "home-1",
		name: "Haus 1",
		ownerIds: ["owner-1"],
		photos: [],
		files: [
			{
				id: "file-1",
				name: "Info.pdf",
				type: "application/pdf",
				size: 123,
				url: "https://example.com/info.pdf",
				folderId: null,
				uploadedAt: "2025-01-01T00:00:00.000Z",
				uploadedBy: "owner-1",
				visibility: "shared",
			},
		],
		privateFiles: [
			{
				id: "file-2",
				name: "Intern.pdf",
				type: "application/pdf",
				size: 456,
				url: "https://example.com/intern.pdf",
				folderId: null,
				uploadedAt: "2025-01-01T00:00:00.000Z",
				uploadedBy: "owner-1",
				visibility: "private",
			},
		],
		folders: [],
		enabled: true,
		createdAt: "2025-01-01T00:00:00.000Z",
		updatedAt: "2025-01-01T00:00:00.000Z",
	};
}

describe("sanitizeHomeFileName", () => {
	it("trims and collapses whitespace", () => {
		expect(sanitizeHomeFileName("  Neue   Anleitung.pdf ")).toBe("Neue Anleitung.pdf");
	});

	it("rejects non-strings and empty input", () => {
		expect(sanitizeHomeFileName(undefined)).toBeNull();
		expect(sanitizeHomeFileName(42)).toBeNull();
		expect(sanitizeHomeFileName("   ")).toBeNull();
	});

	it("strips path separators so a rename cannot escape the record", () => {
		expect(sanitizeHomeFileName("../../etc/passwd")).toBe("etc-passwd");
		expect(sanitizeHomeFileName("folder\\file.pdf")).toBe("folder-file.pdf");
	});

	it("removes leading dots and dashes", () => {
		expect(sanitizeHomeFileName(".hidden.pdf")).toBe("hidden.pdf");
		expect(sanitizeHomeFileName("--Entwurf.pdf")).toBe("Entwurf.pdf");
	});

	it("caps the length", () => {
		const result = sanitizeHomeFileName("a".repeat(500));

		expect(result).not.toBeNull();
		expect(result!.length).toBe(MAX_HOME_FILE_NAME_LENGTH);
	});
});

describe("renameHomeFileInHome", () => {
	it("renames a shared file and keeps the other entries", () => {
		const result = renameHomeFileInHome({ home: buildHome(), fileId: "file-1", name: "Hausordnung.pdf" });

		expect(result.key).toBe("files");
		expect(result.visibility).toBe("shared");
		expect(result.renamedFile.name).toBe("Hausordnung.pdf");
		expect(result.files).toHaveLength(1);
		expect(result.files[0]?.id).toBe("file-1");
	});

	it("renames a private file", () => {
		const result = renameHomeFileInHome({ home: buildHome(), fileId: "file-2", name: "Vertrag.pdf" });

		expect(result.key).toBe("privateFiles");
		expect(result.visibility).toBe("private");
		expect(result.renamedFile.name).toBe("Vertrag.pdf");
	});

	it("preserves every other field of the file", () => {
		const result = renameHomeFileInHome({ home: buildHome(), fileId: "file-1", name: "Neu.pdf" });

		expect(result.renamedFile).toEqual(expect.objectContaining({
			id: "file-1",
			type: "application/pdf",
			size: 123,
			url: "https://example.com/info.pdf",
			visibility: "shared",
		}));
	});

	it("does not mutate the original home object", () => {
		const home = buildHome();
		renameHomeFileInHome({ home, fileId: "file-1", name: "Neu.pdf" });

		expect(home.files[0]?.name).toBe("Info.pdf");
	});

	it("throws when the file does not exist", () => {
		expect(() => renameHomeFileInHome({ home: buildHome(), fileId: "missing", name: "Neu.pdf" }))
			.toThrowError();
	});
});
