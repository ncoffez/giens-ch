import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import FeatureCardsEditor from "../../app/components/ui/FeatureCardsEditor.vue";

describe("FeatureCardsEditor", () => {
	it("shows an empty state and lets admins add a card", async () => {
		const component = await mountSuspended(FeatureCardsEditor, {
			props: {
				modelValue: [],
				"onUpdate:modelValue": () => {},
			},
		});

		expect(component.text()).toContain("Noch keine Karten angelegt");
		await component.find("button").trigger("click");

		const updates = component.emitted("update:modelValue");
		expect(updates).toBeTruthy();
		expect(updates?.[0]?.[0]).toHaveLength(1);
	});

	it("renders the live preview content for existing cards", async () => {
		const component = await mountSuspended(FeatureCardsEditor, {
			props: {
				modelValue: [
					{
						icon: "i-lucide-sun",
						title: "Sonnenplatz",
						description: "Ein ruhiger Platz am Morgen.",
						bgColor: "amber",
						iconColor: "amber",
					},
				],
			},
		});

		expect(component.text()).toContain("Live-Vorschau");
		expect(component.text()).toContain("Sonnenplatz");
		expect(component.text()).toContain("Ein ruhiger Platz am Morgen.");
		expect(component.text()).toContain("1 Karte");
	});
});
