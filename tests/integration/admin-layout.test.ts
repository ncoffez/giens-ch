import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import AdminLayout from "../../app/pages/admin.vue";

describe("Admin layout", () => {
	it("exposes the admin destinations as mobile chips and a desktop sidebar", async () => {
		const component = await mountSuspended(AdminLayout);

		const chips = component.get("[data-admin-mobile-nav]");
		expect(chips.text()).toContain("Häuser");
		expect(chips.text()).toContain("Benutzer");
		expect(chips.text()).toContain("Labels");
		expect(chips.text()).toContain("Papierkorb");
		expect(chips.text()).toContain("Einstellungen");
		expect(chips.text()).not.toContain("Zurück zur Seite");

		expect(component.text()).toContain("Kontrollzentrum");
		expect(component.text()).toContain("Zurück zur Seite");
	});
});
