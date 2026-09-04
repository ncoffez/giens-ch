import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("storage.rules", () => {
	const rules = readFileSync("storage.rules", "utf8");

	it("keeps profile pictures publicly readable", () => {
		expect(rules).toMatch(/match \/profile-pictures\/\{uid\}[\s\S]*allow read:\s*if true/);
	});

	it("denies client writes and default object access", () => {
		expect(rules).toMatch(/allow write:\s*if false/);
		expect(rules).toMatch(/match \/\{\s*allPaths=\*\*\}[\s\S]*allow read, write:\s*if false/);
		expect(rules).not.toContain("request.auth != null");
	});
});
