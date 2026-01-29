import { describe, it, expect, vi } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { nextTick, ref } from "vue";
import ProfileMe from "../../app/pages/profile/me.vue";

describe("Profile Me Page", () => {
	it.skip("renders profile section correctly", async () => {
		const uid = "test-uid";
		
		registerEndpoint(`/api/profile/${uid}`, { 
			handler: () => ({ 
				displayName: "Test User", 
				photoURL: "https://example.com/photo.jpg", 
				email: "test@example.com", 
				articles: [] 
			}) 
		});
		
		const component = await mountSuspended(ProfileMe, {
			global: {
				provide: {
					$currentUser: ref({ uid: uid }),
					$token: ref("test-token"),
					$isAdmin: ref(false),
					$isOwner: ref(false),
					$isPublisher: ref(false),
					$isReader: ref(false),
				},
				stubs: {
					ProfilePictureModal: true,
					PasswordChangeModal: true,
					ArticleList: true,
					UIcon: true,
					UButton: true,
					UAvatar: true
				}
			}
		});
		
		await flushPromises();
		await nextTick();
		await flushPromises();
		await nextTick();
		
		const html = component.html();
		expect(html).toContain("Test User");
		expect(html).toContain("test@example.com");
	});
});
