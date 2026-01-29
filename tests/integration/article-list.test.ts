import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import ArticleList from "../../app/components/ui/ArticleList.vue";

describe("ArticleList Component", () => {
	it("renders a list of articles", async () => {
		const articles = [
			{
				id: "1",
				title: "Article 1",
				published: "2025-01-01",
				intro: "Intro 1",
				image: "/img1.jpg",
				tags: ["tag1"]
			},
			{
				id: "2",
				title: "Article 2",
				published: "2025-01-02",
				intro: "Intro 2",
				image: "/img2.jpg",
				tags: ["tag2"]
			}
		];
		
		const component = await mountSuspended(ArticleList, {
			props: { articles }
		});
		
		expect(component.text()).toContain("Article 1");
		expect(component.text()).toContain("Article 2");
		expect(component.findAll("img")).toHaveLength(2);
	});

	it("renders empty state", async () => {
		const component = await mountSuspended(ArticleList, {
			props: { articles: [] }
		});
		expect(component.exists()).toBe(true);
	});
});
