import { describe, expect, it } from "vitest";
import { sanitizeRedirectPath } from "../../app/utils/redirect";
import { buildAbsoluteSiteUrl, getSiteUrl } from "../../app/utils/seo";

describe("redirect and seo utilities", () => {
	it("keeps only safe internal redirect targets", () => {
		expect(sanitizeRedirectPath("/documents?fileId=1")).toBe("/documents?fileId=1");
		expect(sanitizeRedirectPath("https://evil.example")).toBe("/");
		expect(sanitizeRedirectPath("//evil.example")).toBe("/");
	});

	it("builds absolute site URLs with a stable fallback", () => {
		expect(getSiteUrl("https://giens-ch.web.app/")).toBe("https://giens-ch.web.app");
		expect(buildAbsoluteSiteUrl("/photos/giens-hauser.jpeg", "https://giens-ch.web.app"))
			.toBe("https://giens-ch.web.app/photos/giens-hauser.jpeg");
	});
});
