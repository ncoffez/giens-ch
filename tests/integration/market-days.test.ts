import { describe, expect, it } from "vitest";
import de from "../../i18n/locales/de.json";
import fr from "../../i18n/locales/fr.json";
import { formatMarketDays, getMarketDayKeys } from "../../app/utils/marketDays";

function translator(messages: Record<string, unknown>) {
	return (key: string) => {
		const value = key.split(".").reduce<unknown>((node, part) => {
			return node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined;
		}, messages);
		return typeof value === "string" ? value : key;
	};
}

const tDe = translator(de);
const tFr = translator(fr);

describe("getMarketDayKeys", () => {
	it("uses dayKeys when present", () => {
		expect(getMarketDayKeys({ dayKeys: ["tue", "wed"] })).toEqual(["tue", "wed"]);
	});

	it("falls back to the legacy dayKey", () => {
		expect(getMarketDayKeys({ dayKey: "sun" })).toEqual(["sun"]);
		expect(getMarketDayKeys({ dayKeys: [], dayKey: "sat" })).toEqual(["sat"]);
	});

	it("defaults to Monday when nothing valid is set", () => {
		expect(getMarketDayKeys({})).toEqual(["mon"]);
		expect(getMarketDayKeys(null)).toEqual(["mon"]);
		expect(getMarketDayKeys({ dayKeys: ["xyz"], dayKey: "abc" })).toEqual(["mon"]);
	});

	it("filters invalid keys, dedupes and sorts by weekday", () => {
		expect(getMarketDayKeys({ dayKeys: ["sun", "tue", "xyz", "tue", "mon"] })).toEqual(["mon", "tue", "sun"]);
	});
});

describe("formatMarketDays", () => {
	it("collapses three or more consecutive days into a range", () => {
		expect(formatMarketDays(["tue", "wed", "thu", "fri", "sat", "sun"], tDe)).toBe("Di–So");
		expect(formatMarketDays(["mon", "tue", "wed"], tDe)).toBe("Mo–Mi");
	});

	it("lists shorter runs with commas", () => {
		expect(formatMarketDays(["mon", "wed"], tDe)).toBe("Mo, Mi");
		expect(formatMarketDays(["sat", "sun"], tDe)).toBe("Sa, So");
		expect(formatMarketDays(["mon", "tue", "wed", "fri"], tDe)).toBe("Mo–Mi, Fr");
	});

	it("uses the full day label for a single day", () => {
		expect(formatMarketDays(["sun"], tDe)).toBe(de.travel.maerkte.days.sun);
		expect(formatMarketDays(["mon"], tDe)).toBe(de.travel.maerkte.days.mon);
		expect(formatMarketDays(["sun"], tFr)).toBe(fr.travel.maerkte.days.sun);
	});

	it("formats French ranges with the short labels", () => {
		expect(formatMarketDays(["tue", "wed", "thu", "fri", "sat", "sun"], tFr)).toBe("mar.–dim.");
		expect(formatMarketDays(["mon", "wed"], tFr)).toBe("lun., mer.");
	});

	it("returns an empty string without days", () => {
		expect(formatMarketDays([], tDe)).toBe("");
	});
});
