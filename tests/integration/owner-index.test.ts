import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import OwnerIndex from "../../app/pages/owner/index.vue";

describe("Owner Index Page", () => {
	it("renders page title", async () => {
		const component = await mountSuspended(OwnerIndex, { stubs: ['UiLoginCard'] });
		expect(component.exists()).toBeTruthy();
	});
});
