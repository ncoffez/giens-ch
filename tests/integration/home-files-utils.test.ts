import { describe, expect, it } from "vitest";
import { moveHomeFileBetweenVisibilities } from "../../server/utils/homeFiles";

describe("moveHomeFileBetweenVisibilities", () => {
	it("moves a shared file to private and updates visibility", () => {
		const result = moveHomeFileBetweenVisibilities({
			home: {
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
				privateFiles: [],
				folders: [],
				enabled: true,
				createdAt: "2025-01-01T00:00:00.000Z",
				updatedAt: "2025-01-01T00:00:00.000Z",
			},
			fileId: "file-1",
			sourceVisibility: "shared",
			targetVisibility: "private",
		});

		expect(result.sourceFiles).toHaveLength(0);
		expect(result.targetFiles).toHaveLength(1);
		expect(result.targetFiles[0]).toEqual(expect.objectContaining({
			id: "file-1",
			visibility: "private",
		}));
	});

	it("moves a private file to shared without duplicating it", () => {
		const result = moveHomeFileBetweenVisibilities({
			home: {
				id: "home-1",
				name: "Haus 1",
				ownerIds: ["owner-1"],
				photos: [],
				files: [],
				privateFiles: [
					{
						id: "file-1",
						name: "Intern.pdf",
						type: "application/pdf",
						size: 123,
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
			},
			fileId: "file-1",
			sourceVisibility: "private",
			targetVisibility: "shared",
		});

		expect(result.sourceFiles).toHaveLength(0);
		expect(result.targetFiles).toHaveLength(1);
		expect(result.targetFiles[0]).toEqual(expect.objectContaining({
			id: "file-1",
			visibility: "shared",
		}));
	});
});
