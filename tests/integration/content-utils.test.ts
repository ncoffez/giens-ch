import { describe, expect, it } from "vitest";
import { formatContentDocument } from "../../server/utils/content";

describe("formatContentDocument", () => {
	it("formats legacy localized content documents", () => {
		const result = formatContentDocument("organisatorisches", {
			content: {
				de: "<p>Deutsch</p>",
				fr: "<p>Francais</p>",
			},
			updatedAt: "2026-01-01",
			updatedBy: "user-1",
		}, "fr");

		expect(result).toEqual({
			id: "organisatorisches",
			content: "<p>Francais</p>",
			translated: { fr: "<p>Francais</p>" },
			updatedAt: "2026-01-01",
			updatedBy: "user-1",
		});
	});

	it("returns an empty default document when content is missing", () => {
		expect(formatContentDocument("missing", null, "de")).toEqual({
			id: "missing",
			content: "",
			translated: { fr: "" },
			updatedAt: "",
			updatedBy: "",
		});
	});
});
