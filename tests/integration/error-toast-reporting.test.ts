import { describe, expect, it } from "vitest";
import { shouldReportErrorToast } from "../../app/composables/useAppToast";

describe("shouldReportErrorToast", () => {
	it("reports by default", () => {
		expect(shouldReportErrorToast()).toBe(true);
		expect(shouldReportErrorToast({})).toBe(true);
	});

	// Used by the login form and by the error-report dialog: a failure of the
	// reporting system itself must not be captured as a new error, or the dialog
	// replaces the user's report with the submit failure and the two chase
	// each other.
	it("can be opted out of", () => {
		expect(shouldReportErrorToast({ report: false })).toBe(false);
	});

	it("treats an explicit true as reporting", () => {
		expect(shouldReportErrorToast({ report: true })).toBe(true);
	});
});
