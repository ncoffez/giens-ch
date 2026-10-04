import { describe, expect, it } from "vitest";
import { readBody } from "h3";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { DOCUMENT_ACTIONS, type DocumentAction, type RoleGrants } from "../../shared/sitePermissions";
import PermissionsPage from "../../app/pages/admin/permissions.vue";

function grants(reader = false): RoleGrants {
	return { admin: true, publisher: false, owner: true, reader };
}

function folderActions(explicit: boolean, only?: DocumentAction) {
	return Object.fromEntries(DOCUMENT_ACTIONS.map((action: DocumentAction) => [action, {
		grants: grants(action === "open"),
		explicit: explicit && (!only || action === only),
	}]));
}

async function textIncludes(read: () => string, expected: string) {
	for (let attempt = 0; attempt < 40; attempt += 1) {
		if (read().includes(expected)) return;
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	throw new Error(`Timed out waiting for "${expected}". Page text: ${read()}`);
}

describe("Admin permissions folder tree", () => {
	it("opens one level at a time and edits only the selected folder", async () => {
		let restored = false;
		let savedBody: unknown = null;
		const permissionPayload = () => ({
			rows: [{
				key: "documents.open",
				group: "documents",
				locked: false,
				grants: restored
					? grants(true)
					: { admin: true, publisher: false, owner: true, reader: false },
			}],
			folders: [
				{ id: "house", name: "Hausordnung", parentId: null, actions: folderActions(false) },
				{ id: "pool", name: "Pool", parentId: "house", actions: folderActions(!restored, "open") },
				{ id: "contracts", name: "Verträge", parentId: null, actions: folderActions(!restored) },
			],
		});
		registerEndpoint("/api/admin/permissions", {
			method: "GET",
			handler: () => permissionPayload(),
		});
		registerEndpoint("/api/admin/permissions", {
			method: "PUT",
			handler: async (event) => {
				savedBody = await readBody(event);
				restored = true;
				return { ok: true, audit: null };
			},
		});

		const component = await mountSuspended(PermissionsPage);
		const read = () => component.text();
		const treeNames = () => component.findAll("[role='treeitem'] .truncate").map((item) => item.text());
		await textIncludes(read, "Hausordnung");

		expect(read()).toContain("Standard für alle Ordner");
		expect(read()).toContain("Öffnen");
		expect(read()).not.toContain("rows.documents.open");
		expect(treeNames()).toEqual(["Hausordnung", "Verträge"]);
		expect(component.get("[role='treeitem']").text()).toContain("Standard");
		expect(component.get("[role='treeitem']").text()).toContain("Weiter unten: Pool (Öffnen)");
		expect(component.findAll("[role='treeitem']")[1]?.text()).toContain("Hochladen");
		expect(component.findAll("[role='treeitem']")[1]?.text()).not.toContain("Standard");
		expect(read()).toContain("Ohne Abweichung gilt der Standard.");

		const expand = component.find("[aria-label='Unterordner von Hausordnung anzeigen']");
		expect(expand.exists()).toBe(true);
		await expand.trigger("click");
		await textIncludes(read, "Unterordner weichen ab");
		expect(treeNames()).toContain("Pool");

		const house = component.findAll("button").find((button) => button.text().includes("Hausordnung") && button.text().includes("Standard"));
		expect(house).toBeTruthy();
		await house!.trigger("click");
		await textIncludes(read, "Für diesen Ordner abweichen");
		expect(component.find("[aria-label='Hausordnung Hochladen Admin']").exists()).toBe(false);

		const deviate = component.findAll("button").find((button) => button.text().includes("Für diesen Ordner abweichen"));
		expect(deviate).toBeTruthy();
		await deviate!.trigger("click");
		expect(component.find("[aria-label='Hausordnung Hochladen Admin']").exists()).toBe(true);

		const reset = () => component.findAll("button").find((button) => button.text().includes("Auf Standard zurücksetzen"));
		expect(reset()?.attributes("disabled")).toBeUndefined();
		expect((component.get("[aria-label='Öffnen Reader']").element as HTMLInputElement).checked).toBe(false);
		await reset()!.trigger("click");
		await textIncludes(() => document.body.textContent || "", "Ordnerberechtigungen ebenfalls zurücksetzen");
		const folderReset = document.getElementById("reset-folder-permissions") as HTMLInputElement | null;
		expect(folderReset?.checked).toBe(false);
		folderReset!.checked = true;
		folderReset!.dispatchEvent(new Event("change", { bubbles: true }));
		const apply = [...document.querySelectorAll("button")].find((button) => button.textContent?.includes("Jetzt zurücksetzen"));
		expect(apply).toBeTruthy();
		apply!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		for (let attempt = 0; attempt < 40 && !savedBody; attempt += 1) {
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
		expect(savedBody).toEqual({ grants: {}, folders: {} });
		await textIncludes(() => {
			const box = component.find("[aria-label='Öffnen Reader']");
			if (!box.exists()) return "";
			return (box.element as HTMLInputElement).checked ? "reader-on" : "";
		}, "reader-on");
		expect((component.get("[aria-label='Öffnen Reader']").element as HTMLInputElement).checked).toBe(true);
		expect(component.get("[role='treeitem']").text()).not.toContain("Weiter unten");
		const contracts = component.findAll("[role='treeitem']").find((item) => item.text().includes("Verträge"));
		expect(contracts?.text()).toContain("Standard");
		expect(contracts?.text()).not.toContain("Hochladen");

		const search = component.find("input[placeholder='Ordner suchen']");
		expect(search.exists()).toBe(true);
		await search.setValue("zzz");
		await textIncludes(read, "Kein Ordner passt.");
		expect(read()).not.toContain("Verträge");
	});

	it("keeps folder deviations when the restore checkbox stays off", async () => {
		let savedBody: { grants?: unknown; folders?: Record<string, unknown> } | null = null;
		registerEndpoint("/api/admin/permissions", {
			method: "GET",
			handler: () => ({
				rows: [{
					key: "documents.open",
					group: "documents",
					locked: false,
					grants: { admin: true, publisher: false, owner: true, reader: false },
				}],
				folders: [
					{ id: "house", name: "Hausordnung", parentId: null, actions: folderActions(false) },
					{ id: "pool", name: "Pool", parentId: "house", actions: folderActions(true, "open") },
				],
			}),
		});
		registerEndpoint("/api/admin/permissions", {
			method: "PUT",
			handler: async (event) => {
				savedBody = await readBody(event);
				return { ok: true, audit: null };
			},
		});

		const component = await mountSuspended(PermissionsPage);
		await textIncludes(() => component.text(), "Hausordnung");
		const reset = component.findAll("button").find((button) => button.text().includes("Auf Standard zurücksetzen"));
		await reset!.trigger("click");
		await textIncludes(() => document.body.textContent || "", "Ordnerberechtigungen ebenfalls zurücksetzen");
		const folderReset = document.getElementById("reset-folder-permissions") as HTMLInputElement | null;
		expect(folderReset?.checked).toBe(false);
		const apply = [...document.querySelectorAll("button")].find((button) => button.textContent?.includes("Jetzt zurücksetzen"));
		apply!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		for (let attempt = 0; attempt < 40 && !savedBody; attempt += 1) {
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
		expect(savedBody?.grants).toEqual({});
		expect(Object.keys(savedBody?.folders || {}).sort()).toEqual(["pool"]);
		expect(savedBody?.folders?.pool).toHaveProperty("open");
	});
});
