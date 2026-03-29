import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import MarketItemsEditor from "../../app/components/ui/MarketItemsEditor.vue";

describe("MarketItemsEditor", () => {
	it("normalizes legacy market items without descriptions", async () => {
		const component = await mountSuspended(MarketItemsEditor, {
			props: {
				modelValue: [
					{
						dayKey: "sun",
						label: "La Capte",
					},
				],
			},
		});

		const updates = component.emitted("update:modelValue");
		expect(updates).toBeTruthy();
		expect(updates?.[0]?.[0]?.[0]).toMatchObject({
			dayKey: "sun",
			label: "La Capte",
			description: "",
		});
		expect(component.text()).toContain("0 / 160");
	});
});
