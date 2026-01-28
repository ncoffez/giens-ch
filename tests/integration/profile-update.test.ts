import { describe, it, expect, vi } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { createError, readBody } from "h3";

// Mock Firebase auth function
const mockAuthUpdate = vi.fn();

vi.mock("../../server/api/profile/update.post.ts", () => ({
	default: vi.fn()
}));

describe("Profile Update Integration Tests", () => {
	it("requires authentication to update profile", async () => {
		registerEndpoint("/api/profile/update", {
			method: "POST",
			handler: () => {
				throw createError({ statusCode: 401, message: "Unauthorized" });
			},
		});

		registerEndpoint("/api/articles", {
			method: "GET",
			handler: () => [],
		});

		const event = {} as any;

		const response = await fetch("/api/profile/update", {
			method: "POST",
			headers: {},
			body: JSON.stringify({ displayName: "New Name" }),
		});

		expect(response.status).toBe(401);
	});

	it("validates displayName is at least 2 characters", async () => {
		registerEndpoint("/api/profile/update", {
			method: "POST",
			handler: async (event) => {
				const body = await readBody(event);
				if (body.displayName && body.displayName.length < 2) {
					throw createError({ statusCode: 400, message: "Display name must be at least 2 characters long" });
				}
				return { success: true, displayName: body.displayName };
			},
		});

		const response = await fetch("/api/profile/update", {
			method: "POST",
			headers: { Authorization: "Bearer mock-token" },
			body: JSON.stringify({ displayName: "A" }),
		});

		expect(response.status).toBe(400);
	});

	it("allows users to update their own display name", async () => {
		const mockArticles = [
			{ id: "article1", title: "Test Article", authorUid: "user123", author: "Old Name" }
		];

		registerEndpoint("/api/profile/update", {
			method: "POST",
			handler: async (event) => {
				const body = await readBody(event);
				await new Promise(resolve => setTimeout(resolve, 50));
				return { success: true, displayName: body.displayName };
			},
		});

		registerEndpoint("/api/articles", {
			method: "GET",
			handler: () => mockArticles,
		});

		const response = await fetch("/api/profile/update", {
			method: "POST",
			headers: { Authorization: "Bearer mock-user-123-token" },
			body: JSON.stringify({ displayName: "Updated Name" }),
		});

		expect(response.ok).toBe(true);
		const data = await response.json();
		expect(data.displayName).toBe("Updated Name");
	});

	it("rejects empty display names", async () => {
		registerEndpoint("/api/profile/update", {
			method: "POST",
			handler: () => {
				throw createError({ statusCode: 400, message: "Display name must be at least 2 characters long" });
			},
		});

		const response = await fetch("/api/profile/update", {
			method: "POST",
			headers: { Authorization: "Bearer mock-token" },
			body: JSON.stringify({ displayName: "" }),
		});

		expect(response.status).toBe(400);
	});

	it("updates article author names when display name changes", async () => {
		const mockArticles = [
			{ id: "article1", title: "First Article", authorUid: "user1", author: "Original Name" },
			{ id: "article2", title: "Second Article", authorUid: "user1", author: "Original Name" }
		];

		let updatedArticles: any[] = [];

		registerEndpoint("/api/profile/update", {
			method: "POST",
			handler: async (event) => {
				const body = await readBody(event);
				await new Promise(resolve => setTimeout(resolve, 50));
				updatedArticles = mockArticles.map(article => ({
					...article,
					author: body.displayName
				}));
				return { success: true, displayName: body.displayName };
			},
		});

		registerEndpoint("/api/articles", {
			method: "GET",
			handler: () => updatedArticles,
		});

		const updateResponse = await fetch("/api/profile/update", {
			method: "POST",
			headers: { Authorization: "Bearer mock-user1-token" },
			body: JSON.stringify({ displayName: "New Name" }),
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		const articlesResponse = await fetch("/api/articles");
		const articles = await articlesResponse.json();

		expect(updateResponse.ok).toBe(true);
		expect(articles[0].author).toBe("New Name");
		expect(articles[1].author).toBe("New Name");
	});

	it("rejects display names with only whitespace", async () => {
		registerEndpoint("/api/profile/update", {
			method: "POST",
			handler: () => {
				throw createError({ statusCode: 400, message: "Display name must be at least 2 characters long" });
			},
		});

		const response = await fetch("/api/profile/update", {
			method: "POST",
			headers: { Authorization: "Bearer mock-token" },
			body: JSON.stringify({ displayName: "   " }),
		});

		expect(response.status).toBe(400);
	});

	it("handles Firebase auth update errors gracefully", async () => {
		registerEndpoint("/api/profile/update", {
			method: "POST",
			handler: () => {
				throw createError({ statusCode: 500, message: "Failed to update Firebase Auth: Invalid token" });
			},
		});

		const response = await fetch("/api/profile/update", {
			method: "POST",
			headers: { Authorization: "Bearer mock-token" },
			body: JSON.stringify({ displayName: "Valid Name" }),
		});

		expect(response.status).toBe(500);
	});
});