import { describe, it, expect, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { nextTick, ref } from "vue";
import ProfileMe from "../../app/pages/profile/me.vue";

describe("Profile Me Page", () => {
	it("renders profile section", async () => {
		registerEndpoint("/api/profile/test-uid", { handler: () => ({ displayName: "Test User", photoURL: "", email: "test@example.com", articles: [] }) });
		const component = await mountSuspended(ProfileMe, { 
			registry: {
				provide: {
					$currentUser: ref({ uid: "test-uid" })
				}
			},
			stubs: {
				'ClientOnly': {
					template: '<div><slot /></div>'
				},
				UAvatar: true,
				ProfilePictureModal: true,
				PasswordChangeModal: true,
				ArticleList: true
			}
		});
		await nextTick();
		await flushPromises();
		await nextTick();
		expect(component.html()).toContain("Test User");
		expect(component.html()).toContain("Meine Beiträge");
	});
});
