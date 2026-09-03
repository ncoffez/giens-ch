import { describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import MobileMenuSheet from "../../app/components/ui/MobileMenuSheet.vue";
import { useMobileMenu } from "../../app/composables/useMobileMenu";

const drawerStubs = {
	global: {
		stubs: {
			UDrawer: {
				template: "<div><slot name=\"content\" /></div>",
			},
		},
	},
};

async function mountOpenSheet() {
	const menu = useMobileMenu();
	menu.openMenu();
	const component = await mountSuspended(MobileMenuSheet, drawerStubs);
	return { component, menu };
}

describe("MobileMenuSheet", () => {
	it("renders grouped destinations and search when opened", async () => {
		const { component } = await mountOpenSheet();

		expect(component.get("[data-mobile-menu]").exists()).toBe(true);
		expect(component.text()).toContain("Anreise");
		expect(component.text()).toContain("Login");
		expect(component.text()).not.toContain("Informationen");
		expect(component.text()).not.toContain("Für Mitglieder");
		expect(component.get("input").attributes("placeholder")).toBe("Suchen oder navigieren...");
	});

	it("closes the sheet when a destination is chosen", async () => {
		const { component, menu } = await mountOpenSheet();

		await component.get("[data-mobile-menu] a").trigger("click");

		expect(menu.open.value).toBe(false);
	});

	it("shows an empty search state and clears the query when the sheet closes", async () => {
		const { component, menu } = await mountOpenSheet();

		await component.get("input").setValue("xyz-no-match-123");
		await new Promise((resolve) => setTimeout(resolve, 250));
		await nextTick();

		expect(component.text()).toContain("Keine Treffer gefunden.");

		menu.closeMenu();
		await nextTick();

		expect((component.get("input").element as HTMLInputElement).value).toBe("");
	});
});

