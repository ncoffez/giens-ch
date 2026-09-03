import { describe, expect, it } from "vitest";
import { htmlForLocale } from "../../app/utils/htmlForLocale";
import { publicHtmlDefaults } from "../../app/utils/publicHtmlDefaults";

describe("htmlForLocale", () => {
	it("returns French copy for fr and German otherwise", () => {
		const copy = { de: "<p>de</p>", fr: "<p>fr</p>" };
		expect(htmlForLocale("fr", copy)).toBe("<p>fr</p>");
		expect(htmlForLocale("de", copy)).toBe("<p>de</p>");
		expect(htmlForLocale("en", copy)).toBe("<p>de</p>");
	});
});

describe("publicHtmlDefaults", () => {
	it("covers the empty travel and entdecken intros", () => {
		expect(htmlForLocale("fr", publicHtmlDefaults["travel-zug"])).toContain("train");
		expect(htmlForLocale("fr", publicHtmlDefaults["travel-flugzeug"])).toContain("Toulon");
		expect(htmlForLocale("fr", publicHtmlDefaults["travel-freizeit"])).toContain("presqu'île");
		expect(htmlForLocale("fr", publicHtmlDefaults["travel-einkauf"])).toContain("quotidien");
		expect(htmlForLocale("fr", publicHtmlDefaults["travel-ausfluege"])).toContain("Giens");
		expect(htmlForLocale("de", publicHtmlDefaults["travel-zug"])).toContain("Zug");
	});
});
