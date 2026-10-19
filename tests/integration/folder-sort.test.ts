import { describe, expect, it } from "vitest";
import { compareFoldersWithYears, getFolderYear } from "../../app/utils/folderSort";

interface TestFolder {
	name: string;
	createdAt: string;
}

type SortBy = "name" | "date" | "size";
type SortOrder = "asc" | "desc";

// Mirrors the folder comparator in app/pages/documents/index.vue.
function modeComparator(sortBy: SortBy, sortOrder: SortOrder) {
	return (left: TestFolder, right: TestFolder) => {
		let comparison = 0;
		if (sortBy === "name") {
			comparison = left.name.localeCompare(right.name, "de");
		} else if (sortBy === "date") {
			comparison = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
		}
		return sortOrder === "asc" ? comparison : -comparison;
	};
}

function sortNames(folders: TestFolder[], sortBy: SortBy, sortOrder: SortOrder): string[] {
	const fallback = modeComparator(sortBy, sortOrder);
	return [...folders]
		.sort((a, b) => compareFoldersWithYears(a, b, fallback))
		.map(folder => folder.name);
}

// Created out of order, like the migrated Bulletin folders.
const yearFolders: TestFolder[] = [
	{ name: "2024", createdAt: "2026-03-02T10:00:00.000Z" },
	{ name: "2026", createdAt: "2026-03-01T10:00:00.000Z" },
	{ name: "2025", createdAt: "2026-03-03T10:00:00.000Z" },
];

const modes: Array<[SortBy, SortOrder]> = [
	["date", "desc"],
	["date", "asc"],
	["name", "asc"],
	["name", "desc"],
	["size", "asc"],
];

describe("getFolderYear", () => {
	it("reads a plain year", () => {
		expect(getFolderYear("2025")).toBe(2025);
	});

	it("reads a leading year followed by text", () => {
		expect(getFolderYear("2025 Bulletin")).toBe(2025);
		expect(getFolderYear("2024-Protokolle")).toBe(2024);
	});

	it("ignores names without a leading 4-digit year", () => {
		expect(getFolderYear("Bulletin 2025")).toBeNull();
		expect(getFolderYear("20250")).toBeNull();
		expect(getFolderYear("123")).toBeNull();
		expect(getFolderYear("Archiv")).toBeNull();
		expect(getFolderYear("")).toBeNull();
	});
});

describe("compareFoldersWithYears", () => {
	it.each(modes)("sorts year folders newest first (sort %s %s)", (sortBy, sortOrder) => {
		expect(sortNames(yearFolders, sortBy, sortOrder)).toEqual(["2026", "2025", "2024"]);
	});

	it.each(modes)("puts year folders before other folders (sort %s %s)", (sortBy, sortOrder) => {
		const folders: TestFolder[] = [
			{ name: "Archiv", createdAt: "2026-01-01T10:00:00.000Z" },
			...yearFolders,
			{ name: "Diverses", createdAt: "2026-05-01T10:00:00.000Z" },
		];

		expect(sortNames(folders, sortBy, sortOrder).slice(0, 3)).toEqual(["2026", "2025", "2024"]);
	});

	it("keeps the current sort mode for non-year folders", () => {
		const folders: TestFolder[] = [
			{ name: "Archiv", createdAt: "2026-01-01T10:00:00.000Z" },
			{ name: "2025", createdAt: "2026-03-03T10:00:00.000Z" },
			{ name: "Diverses", createdAt: "2026-05-01T10:00:00.000Z" },
		];

		expect(sortNames(folders, "date", "desc")).toEqual(["2025", "Diverses", "Archiv"]);
		expect(sortNames(folders, "date", "asc")).toEqual(["2025", "Archiv", "Diverses"]);
		expect(sortNames(folders, "name", "asc")).toEqual(["2025", "Archiv", "Diverses"]);
		expect(sortNames(folders, "name", "desc")).toEqual(["2025", "Diverses", "Archiv"]);
	});

	it("handles names starting with a year like \"2025 Bulletin\"", () => {
		const folders: TestFolder[] = [
			{ name: "2024 Bulletin", createdAt: "2026-03-03T10:00:00.000Z" },
			{ name: "Archiv", createdAt: "2026-01-01T10:00:00.000Z" },
			{ name: "2025 Bulletin", createdAt: "2026-03-01T10:00:00.000Z" },
			{ name: "2026", createdAt: "2026-03-02T10:00:00.000Z" },
		];

		expect(sortNames(folders, "date", "desc")).toEqual(["2026", "2025 Bulletin", "2024 Bulletin", "Archiv"]);
		expect(sortNames(folders, "name", "asc")).toEqual(["2026", "2025 Bulletin", "2024 Bulletin", "Archiv"]);
	});

	it("falls back to the current sort mode within the same year", () => {
		const folders: TestFolder[] = [
			{ name: "2025 B", createdAt: "2026-03-01T10:00:00.000Z" },
			{ name: "2025 A", createdAt: "2026-03-02T10:00:00.000Z" },
		];

		expect(sortNames(folders, "name", "asc")).toEqual(["2025 A", "2025 B"]);
		expect(sortNames(folders, "name", "desc")).toEqual(["2025 B", "2025 A"]);
		expect(sortNames(folders, "date", "asc")).toEqual(["2025 B", "2025 A"]);
	});
});
