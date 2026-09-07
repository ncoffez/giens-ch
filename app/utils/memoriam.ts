import type { MemoriamEntry } from "../../types";

export function memoriamBioForLocale(
	entry: Pick<MemoriamEntry, "bio" | "bioByLocale">,
	locale: string,
): string {
	if (locale === "fr") {
		const french = entry.bioByLocale?.fr;
		if (french && french.trim()) return french;
	}

	return entry.bioByLocale?.de || entry.bio || "";
}

function formatPeriodPart(value: string): string {
	if (/^\d{4}$/.test(value)) return value;
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return value;
	return `${match[3]}.${match[2]}.${match[1]}`;
}

export function formatMemoriamPeriod(from: string, to: string): string {
	const start = from ? formatPeriodPart(from) : "";
	const end = to ? formatPeriodPart(to) : "";
	if (start && end) return `${start}–${end}`;
	return start || end;
}
