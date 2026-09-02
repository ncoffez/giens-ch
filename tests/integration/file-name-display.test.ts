import { describe, expect, it } from "vitest";
import { FILE_NAME_DISPLAY_LIMIT, truncateFileName } from "../../app/utils/fileTypes";

describe("truncateFileName", () => {
	it("leaves short names untouched", () => {
		expect(truncateFileName("Hausordnung.pdf")).toBe("Hausordnung.pdf");
	});

	it("returns an empty string for missing names", () => {
		expect(truncateFileName(undefined)).toBe("");
		expect(truncateFileName("   ")).toBe("");
	});

	it("shortens names longer than the display limit", () => {
		const name = "Anleitung-fuer-die-Waschmaschine-und-den-Trockner.pdf";
		const result = truncateFileName(name);

		expect(result.length).toBeLessThanOrEqual(FILE_NAME_DISPLAY_LIMIT);
		expect(result).not.toBe(name);
		expect(result).toContain("…");
	});

	it("keeps the extension visible", () => {
		const result = truncateFileName("Rechnung-Elektriker-Sommer-2026-final-v3.pdf");

		expect(result.endsWith(".pdf")).toBe(true);
	});

	it("keeps head and tail so similar names stay distinguishable", () => {
		const first = truncateFileName("Protokoll-Eigentuemerversammlung-2025.pdf");
		const second = truncateFileName("Protokoll-Eigentuemerversammlung-2026.pdf");

		expect(first).not.toBe(second);
		expect(first.startsWith("Protokoll")).toBe(true);
	});

	it("handles names without a usable extension", () => {
		const result = truncateFileName("Eine-sehr-lange-Notiz-ohne-Dateiendung-am-Ende");

		expect(result.length).toBeLessThanOrEqual(FILE_NAME_DISPLAY_LIMIT);
		expect(result).toContain("…");
	});

	it("respects a custom limit", () => {
		const result = truncateFileName("Hausordnung-Version-2.pdf", 12);

		expect(result.length).toBeLessThanOrEqual(12);
	});
});
