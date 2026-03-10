import { describe, it, expect, vi } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import Home from "../../app/pages/index.vue";

describe("Home Page", () => {
	it("renders the welcome title", async () => {
		registerEndpoint("/api/news", {
			method: "POST",
			handler: () => [
				{
					id: "1",
					title: "Test News",
					intro: "Test Intro",
					published: new Date().toISOString(),
					tags: ["public"],
					image: "/test.jpg",
				},
			],
		});

		const component = await mountSuspended(Home);
		expect(component.text()).toContain("Willkommen im Beausoleil");
	});

	it("renders feature cards", async () => {
		const component = await mountSuspended(Home);
		expect(component.text()).toContain("Wohnkomfort");
		expect(component.text()).toContain("Gemeinschaftsgut");
		expect(component.text()).toContain("Garten & Umgebung");
	});
});
