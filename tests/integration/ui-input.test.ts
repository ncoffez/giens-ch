import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import UiInput from "../../app/components/ui/input.vue";

describe("UiInput Component", () => {
	it("renders input with label", async () => {
		const component = await mountSuspended(UiInput, {
			props: {
				type: "text",
				label: "Test Label",
				modelValue: ""
			},
			propsData: {
				modelValue: ""
			}
		});
		const input = component.find("input");
		const label = component.find("label");
		expect(input.exists()).toBe(true);
		expect(label.exists()).toBe(true);
		expect(label.text()).toBe("Test Label");
	});

	it("binds input type correctly", async () => {
		const component = await mountSuspended(UiInput, {
			props: {
				type: "email",
				label: "Email",
				modelValue: ""
			},
			propsData: {
				modelValue: ""
			}
		});
		const input = component.find("input");
		expect(input.attributes("type")).toBe("email");
	});
});