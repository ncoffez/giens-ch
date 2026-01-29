import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import Logo from "../../app/components/ui/logo.vue";

describe("UiLogo Component", () => {
	it("renders correctly", async () => {
		const component = await mountSuspended(Logo);
		expect(component.exists()).toBe(true);
		expect(component.html()).toContain("Beausoleil");
	});
});
