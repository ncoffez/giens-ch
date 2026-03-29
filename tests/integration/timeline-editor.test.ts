import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import TimelineEditor from "../../app/components/ui/TimelineEditor.vue";

describe("TimelineEditor", () => {
	it("shows an empty state and lets admins add an entry", async () => {
		const component = await mountSuspended(TimelineEditor, {
			props: {
				modelValue: [],
				"onUpdate:modelValue": () => {},
			},
		});

		expect(component.text()).toContain("Noch keine Stationen angelegt");
		await component.find("button").trigger("click");

		const updates = component.emitted("update:modelValue");
		expect(updates).toBeTruthy();
		expect(updates?.[0]?.[0]).toHaveLength(1);
	});

	it("renders the editing-focused layout for existing entries", async () => {
		const component = await mountSuspended(TimelineEditor, {
			props: {
				modelValue: [
					{
						date: "1979/1980",
						title: "Gründung",
						description: "Die ersten Häuser entstehen.",
						icon: "i-lucide-home",
					},
				],
			},
		});

		expect(component.text()).toContain("Zeitstrahl-Editor");
		expect(component.text()).toContain("Datum");
		expect(component.text()).toContain("Titel");
		expect(component.text()).toContain("Icon");
		expect(component.text()).toContain("Beschreibung");
		expect(component.text()).toContain("Gründung");
		expect(component.text()).toContain("1 Eintrag");
	});
});
