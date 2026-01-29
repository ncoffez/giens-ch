import { describe, it, expect } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import HomesIndex from "../../app/pages/homes/index.vue";

describe("Homes Index Page", () => {
	it("renders page structure", async () => {
		registerEndpoint("/api/homes", { handler: () => [] });
		const component = await mountSuspended(HomesIndex, {
			registry: {
				provide: {
					$token: 'mock-token',
					$currentUser: { value: { claims: { owner: true } } }
				}
			}
		});
		expect(component.text()).toContain("My Homes");
	});
});
