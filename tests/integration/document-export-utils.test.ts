import { describe, expect, it } from "vitest";
import { buildTranslatedDocumentFileName, buildTranslatedDocumentHtml } from "../../server/utils/documentExport";

describe("document export helpers", () => {
	it("builds a stable translated export filename", () => {
		expect(buildTranslatedDocumentFileName("Guide d'arrivee.pdf", "fr")).toBe("guide-d-arrivee-fr-translated.html");
		expect(buildTranslatedDocumentFileName("Plan.xlsx", "it")).toBe("plan-it-translated.html");
	});

	it("renders a printable translated html document", () => {
		const html = buildTranslatedDocumentHtml({
			fileName: "Welcome Guide.pdf",
			locale: "fr",
			bodyText: "Bonjour Giens\n\nDeuxieme paragraphe",
			summary: "Version francaise generee automatiquement",
			sourceType: "application/pdf",
			generatedAt: "2026-03-25T10:15:00.000Z",
			translatedAt: "2026-03-25T10:00:00.000Z",
			model: "gemini-2.5-flash",
		});

		expect(html).toContain("<!DOCTYPE html>");
		expect(html).toContain("Welcome Guide");
		expect(html).toContain("Version francaise generee automatiquement");
		expect(html).toContain("<p>Bonjour Giens</p>");
		expect(html).toContain("<p>Deuxieme paragraphe</p>");
		expect(html).toContain("gemini-2.5-flash");
	});
});
