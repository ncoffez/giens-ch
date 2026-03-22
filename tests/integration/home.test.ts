import { describe, it, expect } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import Home from "../../app/pages/index.vue";

describe("Home Page", () => {
	it("renders the welcome title", async () => {
		const component = await mountSuspended(Home);
		expect(component.text()).toContain("Willkommen im Beausoleil");
	});

	it("renders feature cards with default data", async () => {
		registerEndpoint("/api/content/index-features", {
			method: "GET",
			handler: () => ({
				id: "index-features",
				content: "",
				updatedAt: "",
				updatedBy: "",
			}),
		});

		registerEndpoint("/api/content/index-miteinander", {
			method: "GET",
			handler: () => ({
				id: "index-miteinander",
				content: "",
				updatedAt: "",
				updatedBy: "",
			}),
		});

		registerEndpoint("/api/content/index-stats", {
			method: "GET",
			handler: () => ({
				id: "index-stats",
				content: "",
				updatedAt: "",
				updatedBy: "",
			}),
		});

		registerEndpoint("/api/content/index-timeline", {
			method: "GET",
			handler: () => ({
				id: "index-timeline",
				content: "",
				updatedAt: "",
				updatedBy: "",
			}),
		});

		const component = await mountSuspended(Home);
		
		await new Promise(resolve => setTimeout(resolve, 100));
		
		expect(component.text()).toContain("Wohnkomfort");
		expect(component.text()).toContain("Gemeinschaftsgut");
		expect(component.text()).toContain("Garten & Umgebung");
	});
});
