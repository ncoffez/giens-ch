import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import Avatar from "../../app/components/ui/avatar.vue";

describe("UiAvatar Component", () => {
	it("renders user photo if provided", async () => {
		const component = await mountSuspended(Avatar, {
			props: {
				user: {
					photoURL: "/test-photo.jpg",
					displayName: "John Doe",
					email: "john@example.com"
				},
			},
		});
		const img = component.find("img");
		expect(img.exists()).toBe(true);
		expect(img.attributes("src")).toBe("/test-photo.jpg");
	});
});
