import { describe, expect, it } from "vitest";
import { isSourceEditableLocale } from "../../app/utils/contentEditing";

describe("content editing locale guard", () => {
	it("allows editing in german source locale", () => {
		expect(isSourceEditableLocale("de")).toBe(true);
	});

	it("blocks editing in french translation locale", () => {
		expect(isSourceEditableLocale("fr")).toBe(false);
	});
});
