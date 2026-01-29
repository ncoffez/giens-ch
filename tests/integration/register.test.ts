import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import Register from "../../app/pages/register.vue";

describe("Register Page", () => {
	it("renders register form", async () => {
		const component = await mountSuspended(Register);
		expect(component.text()).toContain("Registrieren");
		expect(component.html()).toContain("Name");
		expect(component.html()).toContain("E-Mail");
		expect(component.html()).toContain("Passwort");
		expect(component.html()).toContain("Passwort bestätigen");
	});
});
