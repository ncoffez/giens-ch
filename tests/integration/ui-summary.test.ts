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
				labels: ["tag1", "tag2"],
				index: 0
			},
		});
		expect(component.text()).toContain("Summary Title");
		expect(component.text()).toContain("Summary Subtitle");
		expect(component.text()).toContain("tag1");
	});
});
