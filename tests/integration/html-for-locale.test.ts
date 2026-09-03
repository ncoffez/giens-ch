import { describe, expect, it } from "vitest";
import { htmlForLocale } from "../../app/utils/htmlForLocale";

describe("htmlForLocale", () => {
	it("returns French copy for fr and German otherwise", () => {
		const copy = { de: "<p>de</p>", fr: "<p>fr</p>" };
		expect(htmlForLocale("fr", copy)).toBe("<p>fr</p>");
		expect(htmlForLocale("de", copy)).toBe("<p>de</p>");
		expect(htmlForLocale("en", copy)).toBe("<p>de</p>");
	});
});
