import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import LinksEditor from "../../app/components/ui/LinksEditor.vue";

describe("LinksEditor", () => {
	it("normalizes incomplete link items", async () => {
		const component = await mountSuspended(LinksEditor, {
			props: {
				modelValue: [
					{
						title: "Office de Tourisme Hyères",
					},
				],
			},
		});

		const updates = component.emitted("update:modelValue");
		expect(updates).toBeTruthy();
		expect(updates?.[0]?.[0]?.[0]).toMatchObject({
			title: "Office de Tourisme Hyères",
			description: "",
			url: "",
		});
		expect(component.text()).toContain("0 / 160");
	});

	it("adds a new empty link entry", async () => {
		const component = await mountSuspended(LinksEditor, {
			props: {
				modelValue: [],
			},
		});

		await component.find("button").trigger("click");

		const updates = component.emitted("update:modelValue");
		expect(updates?.at(-1)?.[0]).toEqual([
			{ title: "", description: "", url: "" },
		]);
	});
});
