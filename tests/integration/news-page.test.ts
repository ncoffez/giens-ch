import { describe, it, expect, vi } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import NewsPage from "../../app/pages/news/[[tag]].vue";

let newsResponse: any[] = [];
let labelsResponse: any[] = [{ id: "public", private: false }];

describe("News Page", () => {
	registerEndpoint("/api/labels", {
		method: "GET",
		handler: () => labelsResponse,
	});

	registerEndpoint("/api/news", {
		method: "POST",
		handler: () => newsResponse,
	});

	it("renders news articles", async () => {
		labelsResponse = [{ id: "public", private: false }];
		newsResponse = [
			{
				id: "1",
				title: "News 1",
				intro: "Intro 1",
				published: new Date().toISOString(),
				tags: ["public"],
				image: "/img1.jpg",
			},
		];

		const component = await mountSuspended(NewsPage);
		// Wait for lazy fetch
		await new Promise(resolve => setTimeout(resolve, 100));
		
		expect(component.text()).toContain("News 1");
		expect(component.text()).toContain("Intro 1");
	});

	it("shows 'No news' message when empty", async () => {
		labelsResponse = [{ id: "public", private: false }];
		newsResponse = [];

		const component = await mountSuspended(NewsPage);
		await new Promise(resolve => setTimeout(resolve, 100));
		
		expect(component.text()).toContain("Keine Neuigkeiten zum gewählten Thema gefunden");
	});
});
