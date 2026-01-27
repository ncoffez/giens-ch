import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import Summary from "../../app/components/ui/summary.vue";

describe("UiSummary Component", () => {
	it("renders summary details", async () => {
		const component = await mountSuspended(Summary, {
			props: {
				id: "1",
				title: "Summary Title",
				subtitle: "Summary Subtitle",
				date: "2025-01-01",
				link: "/test",
				imageUrl: "/img.jpg",
				index: 0,
			},
		});
		expect(component.text()).toContain("Summary Title");
		expect(component.text()).toContain("Summary Subtitle");
	});

	it("renders author when provided", async () => {
		const component = await mountSuspended(Summary, {
			props: {
				id: "1",
				title: "Test",
				subtitle: "Sub",
				date: "2025-01-01",
				link: "/test",
				imageUrl: "/img.jpg",
				author: "John Doe",
				authorUid: "user-123",
			},
		});
		expect(component.text()).toContain("John Doe");
	});

	it("does not render author when not provided", async () => {
		const component = await mountSuspended(Summary, {
			props: {
				id: "1",
				title: "Test",
				subtitle: "Sub",
				date: "2025-01-01",
				link: "/test",
				imageUrl: "/img.jpg",
			},
		});
		const text = component.text();
		expect(text).not.toContain("John Doe");
	});

	it("renders image", async () => {
		const component = await mountSuspended(Summary, {
			props: {
				id: "1",
				title: "Test",
				subtitle: "Sub",
				date: "2025-01-01",
				link: "/test",
				imageUrl: "/test.jpg",
			},
		});
		const img = component.find("img");
		expect(img.exists()).toBe(true);
	});

	it("renders as link", async () => {
		const component = await mountSuspended(Summary, {
			props: {
				id: "1",
				title: "Test",
				subtitle: "Sub",
				date: "2025-01-01",
				link: "/article/1",
				imageUrl: "/img.jpg",
			},
		});
		const link = component.find("a");
		expect(link.exists()).toBe(true);
		expect(link.attributes("href")).toBe("/article/1");
	});
});
