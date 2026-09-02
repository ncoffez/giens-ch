import { describe, expect, it } from "vitest";
import { canPreviewFile, getFilePreviewKind } from "../../app/utils/fileTypes";

describe("getFilePreviewKind", () => {
	it("recognises images", () => {
		expect(getFilePreviewKind("image/jpeg")).toBe("image");
		expect(getFilePreviewKind("image/png")).toBe("image");
	});

	it("recognises pdf, video, audio and text", () => {
		expect(getFilePreviewKind("application/pdf")).toBe("pdf");
		expect(getFilePreviewKind("video/mp4")).toBe("video");
		expect(getFilePreviewKind("audio/mpeg")).toBe("audio");
		expect(getFilePreviewKind("text/plain")).toBe("text");
	});

	it("falls back to unsupported for office documents and unknown types", () => {
		expect(getFilePreviewKind("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe("unsupported");
		expect(getFilePreviewKind("application/zip")).toBe("unsupported");
		expect(getFilePreviewKind(undefined)).toBe("unsupported");
		expect(getFilePreviewKind("")).toBe("unsupported");
	});
});

describe("canPreviewFile", () => {
	it("is true only for inline-renderable types", () => {
		expect(canPreviewFile("image/webp")).toBe(true);
		expect(canPreviewFile("application/pdf")).toBe(true);
		expect(canPreviewFile("application/octet-stream")).toBe(false);
		expect(canPreviewFile(undefined)).toBe(false);
	});
});
