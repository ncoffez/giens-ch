import { describe, expect, it } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { readBody } from "h3";
import { readFileSync } from "node:fs";
import AdminLabelsPage from "../../app/pages/admin/labels.vue";

const mockLabels = [
	{ id: "news", name: "news", title: "News", private: false },
	{ id: "intern", name: "intern", title: "Intern", private: true },
];

describe("firestore.rules", () => {
	const rules = readFileSync("firestore.rules", "utf8");

	it("denies default client access", () => {
		const withoutComments = rules.replace(/\/\/.*$/gm, "");
		expect(withoutComments).toMatch(/allow read, write:\s*if false/);
		expect(withoutComments).not.toMatch(/allow read, write:\s*if true/);
	});

	it("has no client-side exceptions", () => {
		expect(rules).not.toContain("request.auth.token.admin");
	});
});

describe("Admin labels page", () => {
	it("renders existing labels from the API", async () => {
		registerEndpoint("/api/labels", {
			method: "GET",
			handler: () => mockLabels,
		});

		const component = await mountSuspended(AdminLabelsPage);
		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(component.text()).toContain("Kategorien und Sichtbarkeit");
		expect(component.text()).toContain("news");
		expect(component.text()).toContain("intern");
		expect(component.text()).toContain("Öffentlich");
		expect(component.text()).toContain("Intern");
	});

	it("creates a label through the admin API instead of the client SDK", async () => {
		const created: Array<Record<string, unknown>> = [];

		registerEndpoint("/api/labels", {
			method: "GET",
			handler: () => mockLabels,
		});
		registerEndpoint("/api/admin/labels", {
			method: "POST",
			handler: async (event) => {
				const body = await readBody(event);
				created.push(body);
				return { id: body.id, title: "Märkte", name: body.id, private: false };
			},
		});

		const component = await mountSuspended(AdminLabelsPage);
		await new Promise((resolve) => setTimeout(resolve, 50));

		const openButton = component.findAll("button").find((button) => button.text().includes("Neues Label erstellen"));
		expect(openButton).toBeTruthy();
		await openButton!.trigger("click");
		await new Promise((resolve) => setTimeout(resolve, 50));

		const input = component.find("input");
		expect(input.exists()).toBe(true);
		await input.setValue("maerkte");

		const submit = component.findAll("button").find((button) => button.text().includes("Erstellen"));
		expect(submit).toBeTruthy();
		await submit!.trigger("click");
		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(created).toEqual([{ id: "maerkte" }]);
	});
});
