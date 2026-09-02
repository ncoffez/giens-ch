import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { hasTranslatableText, stripCodeFence, translateHtml } from "../../server/utils/htmlTranslation";

vi.mock("../../server/utils/documentProcessing", () => ({
	callGemini: vi.fn(),
}));

const { callGemini } = await import("../../server/utils/documentProcessing");

describe("hasTranslatableText", () => {
	it("detects real text", () => {
		expect(hasTranslatableText("<p>Willkommen</p>")).toBe(true);
	});

	it("treats empty markup as nothing to translate", () => {
		expect(hasTranslatableText("")).toBe(false);
		expect(hasTranslatableText(undefined)).toBe(false);
		expect(hasTranslatableText("<p></p>")).toBe(false);
		expect(hasTranslatableText("<p>&nbsp;</p>")).toBe(false);
		expect(hasTranslatableText("<img src=\"a.png\">")).toBe(false);
	});
});

describe("stripCodeFence", () => {
	it("removes an html code fence", () => {
		expect(stripCodeFence("```html\n<p>Bonjour</p>\n```")).toBe("<p>Bonjour</p>");
	});

	it("removes a bare code fence", () => {
		expect(stripCodeFence("```\n<p>Bonjour</p>\n```")).toBe("<p>Bonjour</p>");
	});

	it("leaves plain markup untouched", () => {
		expect(stripCodeFence("  <p>Bonjour</p>  ")).toBe("<p>Bonjour</p>");
	});
});

describe("translateHtml", () => {
	beforeEach(() => {
		vi.mocked(callGemini).mockReset();
	});

	afterEach(() => {
		vi.mocked(callGemini).mockReset();
	});

	it("returns null without an API key", async () => {
		const result = await translateHtml("<p>Hallo</p>", "fr", {});

		expect(result).toBeNull();
		expect(callGemini).not.toHaveBeenCalled();
	});

	it("returns null when there is nothing to translate", async () => {
		const result = await translateHtml("<p>&nbsp;</p>", "fr", { apiKey: "key" });

		expect(result).toBeNull();
		expect(callGemini).not.toHaveBeenCalled();
	});

	it("returns the translated markup", async () => {
		vi.mocked(callGemini).mockResolvedValue("<p>Bonjour</p>");

		const result = await translateHtml("<p>Hallo</p>", "fr", { apiKey: "key" });

		expect(result).toBe("<p>Bonjour</p>");
	});

	it("strips a code fence from the model output", async () => {
		vi.mocked(callGemini).mockResolvedValue("```html\n<p>Bonjour</p>\n```");

		const result = await translateHtml("<p>Hallo</p>", "fr", { apiKey: "key" });

		expect(result).toBe("<p>Bonjour</p>");
	});

	it("asks for the target language and passes the markup", async () => {
		vi.mocked(callGemini).mockResolvedValue("<p>Bonjour</p>");

		await translateHtml("<p>Hallo</p>", "fr", { apiKey: "key", model: "gemini-test" });

		const [apiKey, model, body] = vi.mocked(callGemini).mock.calls[0]!;
		expect(apiKey).toBe("key");
		expect(model).toBe("gemini-test");

		const prompt = (body as any).contents[0].parts[0].text as string;
		expect(prompt).toContain("FR");
		expect(prompt).toContain("<p>Hallo</p>");
	});

	it("propagates model failures so the caller can decide", async () => {
		vi.mocked(callGemini).mockRejectedValue(new Error("Gemini API error (429)"));

		await expect(translateHtml("<p>Hallo</p>", "fr", { apiKey: "key" })).rejects.toThrow("429");
	});
});
