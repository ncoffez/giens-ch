import { describe, expect, it } from "vitest";
import de from "../../i18n/locales/de.json";
import fr from "../../i18n/locales/fr.json";

function flattenMessages(value: unknown, prefix = "", output: Record<string, unknown> = {}) {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		for (const [key, nestedValue] of Object.entries(value)) {
			const nextPrefix = prefix ? `${prefix}.${key}` : key;
			flattenMessages(nestedValue, nextPrefix, output);
		}
		return output;
	}

	output[prefix] = value;
	return output;
}

describe("translations", () => {
	it("keeps French locale aligned with German locale keys", () => {
		const germanMessages = flattenMessages(de);
		const frenchMessages = flattenMessages(fr);

		const germanKeys = Object.keys(germanMessages).sort();
		const frenchKeys = Object.keys(frenchMessages).sort();

		expect(frenchKeys).toEqual(germanKeys);
	});
});
