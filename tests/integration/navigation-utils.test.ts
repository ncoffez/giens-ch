import { describe, expect, it } from "vitest";
import { buildNavigationItems, buildPublicNavigationItems } from "../../app/utils/navigation";

describe("navigation helpers", () => {
	const t = (key: string) => ({
		"nav.home": "Home",
		"nav.travel": "Anreise",
		"nav.entdecken": "Entdecken",
		"nav.documents": "Dokumente",
		"nav.organisatorisches": "Organisatorisches",
	}[key] ?? key);
	const localePath = (path: string) => path;

	it("orders public navigation as travel, entdecken, organisatorisches", () => {
		const items = buildPublicNavigationItems(t, localePath, "/travel");

		expect(items.map((item) => item.label)).toEqual([
			"Anreise",
			"Entdecken",
			"Organisatorisches",
		]);
		expect(items[0]?.active).toBe(true);
	});

	it("places documents last for authenticated navigation", () => {
		const items = buildNavigationItems(t, localePath, "/documents", true, true);

		expect(items.map((item) => item.label)).toEqual([
			"Home",
			"Anreise",
			"Entdecken",
			"Organisatorisches",
			"Dokumente",
		]);
		expect(items[4]?.active).toBe(true);
	});

	it("keeps compact navigation in the same order without home", () => {
		const items = buildNavigationItems(t, localePath, "/entdecken", true, false);

		expect(items.map((item) => item.label)).toEqual([
			"Anreise",
			"Entdecken",
			"Organisatorisches",
			"Dokumente",
		]);
		expect(items[1]?.active).toBe(true);
	});
});
