import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import TiptapViewer from "../../app/components/tiptap/viewer.vue";

describe("TiptapViewer Component", () => {
	it("renders content in prose view by default", async () => {
		const component = await mountSuspended(TiptapViewer, {
			props: {
				codeView: false
			}
		});
		const prose = component.find(".prose");
		expect(prose.exists()).toBe(true);
	});

	it("renders content in code view when codeView is true", async () => {
		const component = await mountSuspended(TiptapViewer, {
			props: {
				codeView: true
			}
		});
		const codeElement = component.find("code");
		expect(codeElement.exists()).toBe(true);
	});
});