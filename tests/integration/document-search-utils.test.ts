import { describe, expect, it } from "vitest";
import {
	buildDocumentSearchFields,
	buildDocumentSearchFieldsFromBuffer,
	buildSearchKeywords,
	canExtractDocumentText,
	extractDocumentText,
	normalizeSearchText,
	summarizeSearchText,
} from "../../server/utils/documentSearch";

describe("document search helpers", () => {
	it("normalizes text for indexing", () => {
		expect(normalizeSearchText("Marchés & Märkte 2026")).toBe("marches markte 2026");
	});

	it("derives stable keywords from filenames", () => {
		expect(buildSearchKeywords("Hausordnung-Beausoleil 2026.pdf")).toEqual([
			"hausordnung",
			"beausoleil",
			"2026",
			"pdf",
		]);
	});

	it("builds search fields with summary and timestamps", () => {
		const fields = buildDocumentSearchFields({
			name: "Budget Haus 7.xlsx",
			searchText: "Jahresbudget Rücklagen",
			searchSummary: "Budgetübersicht Haus 7",
		});

		expect(fields.searchText).toBe("Jahresbudget Rücklagen");
		expect(fields.searchSummary).toBe("Budgetübersicht Haus 7");
		expect(fields.searchKeywords).toContain("budget");
		expect(fields.searchUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	it("detects extractable text documents by type and extension", () => {
		expect(canExtractDocumentText("reiseplan.txt", "text/plain")).toBe(true);
		expect(canExtractDocumentText("beleg.json", "application/octet-stream")).toBe(true);
		expect(canExtractDocumentText("scan.pdf", "application/pdf")).toBe(false);
	});

	it("extracts searchable text from markup-heavy files", () => {
		const text = extractDocumentText(
			"info.html",
			Buffer.from("<h1>Marche</h1><p>Horaires &amp; adresse</p>"),
			"text/html",
		);

		expect(text).toBe("Marche Horaires & adresse");
	});

	it("builds search fields directly from uploaded content", () => {
		const fields = buildDocumentSearchFieldsFromBuffer({
			name: "reiseplan.txt",
			type: "text/plain",
			buffer: Buffer.from("Ankunft Toulon\nBus 67 Richtung Giens"),
		});

		expect(fields.searchText).toContain("Bus 67 Richtung Giens");
		expect(fields.searchSummary).toContain("Ankunft Toulon");
		expect(fields.searchKeywords).toContain("reiseplan");
	});

	it("falls back to the filename when no searchable text is available", () => {
		expect(summarizeSearchText("", "Scan.pdf")).toBe("Scan.pdf");
	});
});
