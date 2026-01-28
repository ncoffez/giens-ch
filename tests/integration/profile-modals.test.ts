import { describe, it, expect, vi } from "vitest";
import { ref } from "vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import ProfilePictureModal from "../../app/components/ui/ProfilePictureModal.vue";
import PasswordChangeModal from "../../app/components/ui/PasswordChangeModal.vue";

// Mock global dependencies
vi.mock("#app", () => ({
	useNuxtApp: () => ({
		$token: { value: "test-token" },
		$currentUser: { value: { uid: "test-uid", photoURL: "http://test.com/pic.jpg", email: "test@test.com" } }
	}),
	useToast: () => ({
		add: vi.fn()
	}),
	useFetch: () => ({
		data: ref({ pictures: [] }),
		refresh: vi.fn()
	}),
	useAsyncData: () => ({
		data: ref({ pictures: [] }),
		refresh: vi.fn()
	})
}));

describe("Profile Modals", () => {
	it("renders ProfilePictureModal when modelValue is true", async () => {
		const wrapper = await mountSuspended(ProfilePictureModal, {
			props: {
				modelValue: true
			},
			global: {
				stubs: {
					UModal: {
						template: '<div id="modal-stub"><h2>{{ title }}</h2><slot name="content" /><slot /></div>',
						props: ['modelValue', 'title']
					},
					UAvatar: true,
					UButton: true,
					UProgress: true,
					UIcon: true
				}
			}
		});

		expect(wrapper.find("#modal-stub").exists()).toBe(true);
		expect(wrapper.text()).toContain("Dein aktuelles Profilbild");
	});

	it("renders PasswordChangeModal when modelValue is true", async () => {
		const wrapper = await mountSuspended(PasswordChangeModal, {
			props: {
				modelValue: true
			},
			global: {
				stubs: {
					UModal: {
						template: '<div id="modal-stub"><h2>{{ title }}</h2><slot name="content" /><slot /></div>',
						props: ['modelValue', 'title']
					},
					UForm: true,
					UFormField: true,
					UInput: true,
					UButton: true
				}
			}
		});

		expect(wrapper.find("#modal-stub").exists()).toBe(true);
		expect(wrapper.text()).toContain("Passwort ändern");
	});
});
