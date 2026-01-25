import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import Title from "../../app/components/ui/title.vue";

describe("UiTitle Component", () => {
	it("renders title and subtitle", async () => {
		const component = await mountSuspended(Title, {
			props: {
				title: "Main Title",
				subtitle: "Sub Title",
			},
		});
		expect(component.text()).toContain("Main Title");
		expect(component.text()).toContain("Sub Title");
	});
});
