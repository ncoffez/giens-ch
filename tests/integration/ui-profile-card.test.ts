import { describe, it, expect, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import ProfileCard from "../../app/components/ui/profile-card.vue";

describe("UiProfileCard Component", () => {
	it("renders user profile with photo", async () => {
		// Mock the useCurrentUser composable
		const mockUser = {
			photoURL: "/test-photo.jpg",
			displayName: "Test User",
			email: "test@example.com",
			uid: "test-uid"
		};

		// Set global mock user
		(global as any).__FIREBASE_MOCK__.user = mockUser;

		const component = await mountSuspended(ProfileCard, {});
		const profile = component.find("#profile");
		const img = component.find("img");
		
		// Verify the component renders properly
		expect(profile.exists()).toBe(true);
		expect(img.exists()).toBe(true);
	});

	it("renders placeholder photo when user has no photo", async () => {
		// Mock user without photo
		const mockUser = {
			displayName: "Test User",
			email: "test@example.com",
			uid: "test-uid"
		};

		(global as any).__FIREBASE_MOCK__.user = mockUser;

		const component = await mountSuspended(ProfileCard, {});
		const img = component.find("img");
		// Check for placeholder image
		expect(img.attributes("src")).toContain("placeholder");
	});
});