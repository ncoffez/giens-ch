import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import MobileNav from "../../app/components/ui/mobile-nav.vue";

describe("UiMobileNav", () => {
	it("renders the fixed tabs plus a menu trigger", async () => {
		const component = await mountSuspended(MobileNav);
		const labels = component.findAll("[data-mobile-nav-list] .mobile-nav-label").map((node) => node.text());

		expect(labels).toEqual(["Home", "Entdecken", "Organisatorisches", "Menü"]);
		expect(component.find("[data-mobile-nav-menu]").attributes("aria-label")).toBe("Menü öffnen");
		expect(component.find("[data-mobile-nav-menu]").attributes("aria-expanded")).toBe("false");
	});

	it("opens the shared mobile menu when the menu tab is clicked", async () => {
		const component = await mountSuspended(MobileNav);
		await component.get("[data-mobile-nav-menu]").trigger("click");

		expect(component.find("[data-mobile-nav-menu]").attributes("aria-expanded")).toBe("true");
	});
});
