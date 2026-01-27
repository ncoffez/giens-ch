import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import NotFound from "../../app/components/notAuthorized.vue";

describe("notAuthorized Component", () => {
	it("renders the unauthorized message", async () => {
		const component = await mountSuspended(NotFound, {});
		const h1 = component.find("h1");
		expect(h1.exists()).toBe(true);
		expect(h1.text()).toContain("Fehler");
		
		const p = component.find("p");
		expect(p.text()).toContain("nicht berechtigt");
	});
});