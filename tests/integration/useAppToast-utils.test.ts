import { describe, expect, it } from "vitest";
import { shouldReportErrorToast } from "../../app/composables/useAppToast";

describe("useAppToast reporting policy", () => {
	it("reports error toasts by default", () => {
		expect(shouldReportErrorToast()).toBe(true);
		expect(shouldReportErrorToast({ source: "page-content-save" })).toBe(true);
	});

	it("allows validation toasts to opt out from error reporting", () => {
		expect(shouldReportErrorToast({ report: false })).toBe(false);
	});
});

