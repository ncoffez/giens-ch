import { describe, expect, it } from "vitest";
import {
	permissionFolderChangeIndex,
	permissionFolderIdsWithMarkedDescendant,
	permissionFolderPath,
	visiblePermissionFolders,
	type PermissionTreeFolder,
} from "../../app/utils/permissionFolderTree";

function folder(id: string, name: string, parentId: string | null = null): PermissionTreeFolder {
	return { id, name, parentId };
}

describe("permission folder tree", () => {
	const folders = [
		folder("contracts", "Verträge"),
		folder("house", "Hausordnung"),
		folder("pool", "Pool", "house"),
		folder("heater", "Heizung", "house"),
		folder("pump", "Pumpe", "pool"),
	];

	it("shows only the top level until a folder is expanded", () => {
		const collapsed = visiblePermissionFolders(folders, new Set(), "de");
		expect(collapsed.map((row) => [row.folder.name, row.depth, row.childCount])).toEqual([
			["Hausordnung", 0, 2],
			["Verträge", 0, 0],
		]);

		const opened = visiblePermissionFolders(folders, new Set(["house"]), "de");
		expect(opened.map((row) => [row.folder.name, row.depth])).toEqual([
			["Hausordnung", 0],
			["Heizung", 1],
			["Pool", 1],
			["Verträge", 0],
		]);

		const deep = visiblePermissionFolders(folders, new Set(["house", "pool"]), "de");
		expect(deep.map((row) => row.folder.name)).toEqual([
			"Hausordnung",
			"Heizung",
			"Pool",
			"Pumpe",
			"Verträge",
		]);
		expect(deep.find((row) => row.folder.id === "pump")?.depth).toBe(2);
	});

	it("keeps a folder with a missing parent at the root", () => {
		const rows = visiblePermissionFolders([
			folder("lost", "Archiv", "missing"),
		], new Set(), "de");
		expect(rows.map((row) => row.folder.id)).toEqual(["lost"]);
		expect(rows[0]?.depth).toBe(0);
	});

	it("opens a parent cycle once, at the lowest id", () => {
		const rows = visiblePermissionFolders([
			folder("b", "Beta", "a"),
			folder("a", "Alpha", "b"),
		], new Set(["a", "b"]), "de");
		expect(rows.map((row) => [row.folder.id, row.depth])).toEqual([
			["a", 0],
			["b", 1],
		]);
	});

	it("treats a folder that is its own parent as a root", () => {
		const rows = visiblePermissionFolders([
			folder("loop", "Schleife", "loop"),
		], new Set(["loop"]), "de");
		expect(rows).toHaveLength(1);
		expect(rows[0]?.depth).toBe(0);
		expect(rows[0]?.expanded).toBe(false);
	});

	it("searches by name and opens only the path to a match", () => {
		const rows = visiblePermissionFolders(folders, new Set(), "de", " pum ");
		expect(rows.map((row) => [row.folder.name, row.expanded])).toEqual([
			["Hausordnung", true],
			["Pool", true],
			["Pumpe", false],
		]);
	});

	it("hides non-matching children of a matching folder", () => {
		const rows = visiblePermissionFolders(folders, new Set(["house"]), "de", "haus");
		expect(rows.map((row) => row.folder.name)).toEqual(["Hausordnung"]);
		expect(rows[0]?.expanded).toBe(false);
		expect(rows[0]?.childCount).toBe(2);
	});

	it("builds the ancestor path without looping", () => {
		expect(permissionFolderPath(folders, "pump").map((entry) => entry.id)).toEqual([
			"house",
			"pool",
			"pump",
		]);
		expect(permissionFolderPath(folders, "missing")).toEqual([]);
		expect(permissionFolderPath([
			folder("b", "Beta", "a"),
			folder("a", "Alpha", "b"),
		], "b").map((entry) => entry.id)).toEqual(["a", "b"]);
	});

	it("lists changed actions on a folder and on the ancestors above it", () => {
		const changes = permissionFolderChangeIndex(folders, new Map([
			["pool", ["open"]],
			["pump", ["delete"]],
			["contracts", ["upload"]],
		]), "de");

		expect(changes.get("house")).toEqual({
			actions: [],
			below: [
				{ id: "pool", name: "Pool", actions: ["open"] },
				{ id: "pump", name: "Pumpe", actions: ["delete"] },
			],
		});
		expect(changes.get("pool")?.below).toEqual([
			{ id: "pump", name: "Pumpe", actions: ["delete"] },
		]);
		expect(changes.get("contracts")).toEqual({
			actions: ["upload"],
			below: [],
		});
		expect(changes.get("heater")).toEqual({ actions: [], below: [] });
	});

	it("marks ancestors of a folder with its own assignment", () => {
		const marked = permissionFolderIdsWithMarkedDescendant(folders, new Set(["pump"]), "de");
		expect(Array.from(marked).sort()).toEqual(["house", "pool"]);
	});
});
