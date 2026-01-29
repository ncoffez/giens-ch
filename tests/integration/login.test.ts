import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import Login from "../../app/pages/login.vue";

describe("Login Page", () => {
	it("renders login form", async () => {
		const component = await mountSuspended(Login);
		expect(component.text()).toContain("Anmelden");
		expect(component.html()).toContain("E-Mail");
		expect(component.html()).toContain("Passwort");
	});
});
