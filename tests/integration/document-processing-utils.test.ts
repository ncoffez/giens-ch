import { deflateRawSync } from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildDocumentProcessingRecord, extractDocumentBody, translateDocumentBody } from "../../server/utils/documentProcessing";

const buildZipBuffer = (entries: Record<string, string>) => {
	const localFiles: Buffer[] = [];
	const centralDirectory: Buffer[] = [];
	let offset = 0;

	for (const [name, content] of Object.entries(entries)) {
		const fileName = Buffer.from(name, "utf8");
		const compressed = deflateRawSync(Buffer.from(content, "utf8"));
		const localHeader = Buffer.alloc(30);
		localHeader.writeUInt32LE(0x04034b50, 0);
		localHeader.writeUInt16LE(20, 4);
		localHeader.writeUInt16LE(0, 6);
		localHeader.writeUInt16LE(8, 8);
		localHeader.writeUInt32LE(0, 10);
		localHeader.writeUInt32LE(0, 14);
		localHeader.writeUInt32LE(compressed.length, 18);
		localHeader.writeUInt32LE(Buffer.byteLength(content), 22);
		localHeader.writeUInt16LE(fileName.length, 26);
		localHeader.writeUInt16LE(0, 28);

		const localRecord = Buffer.concat([localHeader, fileName, compressed]);
		localFiles.push(localRecord);

		const centralHeader = Buffer.alloc(46);
		centralHeader.writeUInt32LE(0x02014b50, 0);
		centralHeader.writeUInt16LE(20, 4);
		centralHeader.writeUInt16LE(20, 6);
		centralHeader.writeUInt16LE(0, 8);
		centralHeader.writeUInt16LE(8, 10);
		centralHeader.writeUInt32LE(0, 12);
		centralHeader.writeUInt32LE(0, 16);
		centralHeader.writeUInt32LE(compressed.length, 20);
		centralHeader.writeUInt32LE(Buffer.byteLength(content), 24);
		centralHeader.writeUInt16LE(fileName.length, 28);
		centralHeader.writeUInt16LE(0, 30);
		centralHeader.writeUInt16LE(0, 32);
		centralHeader.writeUInt16LE(0, 34);
		centralHeader.writeUInt16LE(0, 36);
		centralHeader.writeUInt32LE(0, 38);
		centralHeader.writeUInt32LE(offset, 42);
		centralDirectory.push(Buffer.concat([centralHeader, fileName]));

		offset += localRecord.length;
	}

	const centralDirectoryBuffer = Buffer.concat(centralDirectory);
	const endRecord = Buffer.alloc(22);
	endRecord.writeUInt32LE(0x06054b50, 0);
	endRecord.writeUInt16LE(0, 4);
	endRecord.writeUInt16LE(0, 6);
	endRecord.writeUInt16LE(centralDirectory.length, 8);
	endRecord.writeUInt16LE(centralDirectory.length, 10);
	endRecord.writeUInt32LE(centralDirectoryBuffer.length, 12);
	endRecord.writeUInt32LE(offset, 16);
	endRecord.writeUInt16LE(0, 20);

	return Buffer.concat([...localFiles, centralDirectoryBuffer, endRecord]);
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe("document processing helpers", () => {
	it("extracts DOCX text from OOXML archives", async () => {
		const buffer = buildZipBuffer({
			"word/document.xml": "<w:document><w:body><w:p><w:r><w:t>Bonjour</w:t></w:r></w:p><w:p><w:r><w:t>Giens</w:t></w:r></w:p></w:body></w:document>",
		});

		const result = await extractDocumentBody("guide.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer, {});

		expect(result.source).toBe("ooxml");
		expect(result.text).toContain("Bonjour");
		expect(result.text).toContain("Giens");
	});

	it("extracts XLSX text from worksheet rows", async () => {
		const buffer = buildZipBuffer({
			"xl/sharedStrings.xml": "<sst><si><t>Arrivee</t></si><si><t>Giens</t></si></sst>",
			"xl/worksheets/sheet1.xml": "<worksheet><sheetData><row><c t=\"s\"><v>0</v></c><c t=\"s\"><v>1</v></c></row></sheetData></worksheet>",
		});

		const result = await extractDocumentBody("plan.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer, {});

		expect(result.source).toBe("ooxml");
		expect(result.text).toContain("Arrivee");
		expect(result.text).toContain("Giens");
	});

	it("uses Gemini for OCR translation workflows when configured", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
			ok: true,
			json: async () => ({
				candidates: [
					{ content: { parts: [{ text: "Texte traduit" }] } },
				],
			}),
		} as Response);

		const translation = await translateDocumentBody("Originaltext", "fr", {
			geminiApiKey: "test-key",
			geminiModel: "gemini-2.5-flash",
		});

		expect(translation?.searchText).toBe("Texte traduit");
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("builds a processing record with translated content", async () => {
		vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
			ok: true,
			json: async () => ({
				candidates: [
					{ content: { parts: [{ text: "Texte OCR traduit" }] } },
				],
			}),
		} as Response);

		const record = await buildDocumentProcessingRecord({
			scope: "global",
			fileId: "file-1",
			name: "scan.pdf",
			type: "application/pdf",
			buffer: Buffer.from("fake-pdf"),
			translationLanguages: ["fr"],
			geminiApiKey: "test-key",
			geminiModel: "gemini-2.5-flash",
		});

		expect(record.id).toBe("global:file-1");
		expect(record.translations?.fr.searchText).toBe("Texte OCR traduit");
		expect(record.translationLanguages).toContain("fr");
	});
});
