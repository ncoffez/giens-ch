import type { MarketItem } from "../../types";

export const DAY_ORDER: readonly string[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const VALID_DAY_KEYS = new Set(DAY_ORDER);

type Translate = (key: string) => string;

/**
 * Returns the weekdays of a market, valid, deduplicated and in week order.
 * Reads the new `dayKeys` list and falls back to the legacy single `dayKey`.
 */
export function getMarketDayKeys(item: Partial<MarketItem> | null | undefined): string[] {
	const dayKeys = item?.dayKeys;
	const listed = Array.isArray(dayKeys) ? dayKeys.filter(dayKey => VALID_DAY_KEYS.has(dayKey)) : [];
	const legacy = item?.dayKey && VALID_DAY_KEYS.has(item.dayKey) ? [item.dayKey] : [];
	const source = listed.length ? listed : legacy;

	if (!source.length) return ["mon"];

	return DAY_ORDER.filter(dayKey => source.includes(dayKey));
}

/**
 * Formats market weekdays for display: a single day uses the full label,
 * runs of 3+ consecutive days collapse to "Di–So", shorter runs are listed ("Mo, Mi").
 */
export function formatMarketDays(dayKeys: readonly string[], t: Translate): string {
	const indices = DAY_ORDER
		.map((dayKey, index) => (dayKeys.includes(dayKey) ? index : -1))
		.filter(index => index >= 0);

	if (!indices.length) return "";
	if (indices.length === 1) return t(`travel.maerkte.days.${DAY_ORDER[indices[0] as number]}`);

	const short = (index: number) => t(`travel.maerkte.daysShort.${DAY_ORDER[index]}`);
	const runs: number[][] = [];

	for (const index of indices) {
		const lastRun = runs[runs.length - 1];
		if (lastRun && lastRun[lastRun.length - 1] === index - 1) {
			lastRun.push(index);
		} else {
			runs.push([index]);
		}
	}

	return runs
		.map(run => (run.length >= 3
			? `${short(run[0] as number)}–${short(run[run.length - 1] as number)}`
			: run.map(short).join(", ")))
		.join(", ");
}
