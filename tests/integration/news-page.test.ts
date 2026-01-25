import { describe, it, expect, vi } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import NewsPage from "../../app/pages/news/[[tag]].vue";

describe("News Page", () => {
	it("renders news articles", async () => {
		registerEndpoint("/api/labels", {
			method: "GET",
			handler: () => [{ id: "public", private: false }],
		});

		registerEndpoint("/api/news", {
			method: "POST",
			handler: () => [
				{
					id: "1",
					title: "News 1",
					intro: "Intro 1",
					published: new Date().toISOString(),
					tags: ["public"],
					image: "/img1.jpg",
				},
			],
		});

		const component = await mountSuspended(NewsPage);
		// Wait for lazy fetch
		await new Promise(resolve => setTimeout(resolve, 100));
		
		expect(component.text()).toContain("News 1");
		expect(component.text()).toContain("Intro 1");
	});

	it("shows 'No news' message when empty", async () => {
		registerEndpoint("/api/news", {
			method: "POST",
			handler: () => [],
		});

		const component = await mountSuspended(NewsPage);
		await new Promise(resolve => setTimeout(resolve, 100));
		
		expect(component.text()).toContain("Keine Neuigkeiten zum gewählten Thema gefunden");
	});
});
