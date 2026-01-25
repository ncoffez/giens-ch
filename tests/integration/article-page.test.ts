import { describe, it, expect, vi } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import ArticlePage from "../../app/pages/article/[id].vue";

describe("Article Page", () => {
	it("renders article content", async () => {
		registerEndpoint("/api/getArticle", {
			method: "POST",
			handler: () => ({
				id: "test-id",
				title: "Detail Title",
				body: "<p>Detail Body</p>",
				published: new Date().toISOString(),
				tags: ["test"],
				image: "/detail.jpg",
			}),
		});

		const component = await mountSuspended(ArticlePage, {
			route: { params: { id: "test-id" } }
		});
		
		await new Promise(resolve => setTimeout(resolve, 100));
		
		expect(component.text()).toContain("Detail Title");
		expect(component.html()).toContain("Detail Body");
	});

	it("shows error message on failure", async () => {
		registerEndpoint("/api/getArticle", {
			method: "POST",
			handler: () => {
				throw createError({ statusCode: 500, message: "Failed to fetch" });
			},
		});

		const component = await mountSuspended(ArticlePage, {
			route: { params: { id: "error-id" } }
		});
		
		await new Promise(resolve => setTimeout(resolve, 100));
		
		expect(component.text()).toContain("Error loading article");
	});
});
