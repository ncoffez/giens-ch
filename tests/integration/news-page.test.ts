import { describe, it, expect, vi, beforeEach } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import NewsPage from "../../app/pages/news/[[tag]].vue";

describe("News Page", () => {
	it("renders news articles", async () => {
		registerEndpoint("/api/labels", {
			method: "GET",
			handler: () => [{ id: "public", private: false }],
		});

		registerEndpoint("/api/authors", {
			method: "GET",
			handler: () => ["Admin"],
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
					author: "Admin",
				},
			],
		});

		const component = await mountSuspended(NewsPage, { route: "/news/public" });
		// Wait for lazy fetch
		await new Promise(resolve => setTimeout(resolve, 200));
		
		expect(component.text()).toContain("News 1");
		expect(component.text()).toContain("Intro 1");
		expect(component.text()).toContain("Admin");
	});

	it("shows 'No news' message when empty", async () => {
		registerEndpoint("/api/labels", {
			method: "GET",
			handler: () => [{ id: "empty", private: false }],
		});

		registerEndpoint("/api/authors", {
			method: "GET",
			handler: () => [],
		});

		registerEndpoint("/api/news", {
			method: "POST",
			handler: () => [],
		});

		const component = await mountSuspended(NewsPage, { route: "/news/empty" });
		await new Promise(resolve => setTimeout(resolve, 200));
		
		expect(component.text()).toContain("Keine Neuigkeiten zum gewählten Thema gefunden");
	});
});
