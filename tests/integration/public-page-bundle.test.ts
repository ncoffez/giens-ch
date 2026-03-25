import { describe, expect, it } from "vitest";
import { extractLocalizedString, parseLocalizedJson } from "../../app/composables/usePublicPageBundle";

describe("usePublicPageBundle helpers", () => {
	it("extracts translated string content for french locale", () => {
		const result = extractLocalizedString({
			id: "travel-lage",
			content: "<p>Deutsch</p>",
			translated: { fr: "<p>Francais</p>" },
			updatedAt: "",
			updatedBy: "",
		}, "fr");

		expect(result).toBe("<p>Francais</p>");
	});

	it("parses localized JSON content and falls back to defaults on invalid payloads", () => {
		const parsed = parseLocalizedJson({
			id: "index-stats",
			content: JSON.stringify([{ value: "20", label: "Hauser" }]),
			translated: {},
			updatedAt: "",
			updatedBy: "",
		}, "de", [{ value: "0", label: "Fallback" }]);

		expect(parsed).toEqual([{ value: "20", label: "Hauser" }]);

		const fallback = parseLocalizedJson({
			id: "index-stats",
			content: "not-json",
			translated: {},
			updatedAt: "",
			updatedBy: "",
		}, "de", [{ value: "0", label: "Fallback" }]);

		expect(fallback).toEqual([{ value: "0", label: "Fallback" }]);
	});
});
