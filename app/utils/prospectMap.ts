/** Pin chosen for the public prospect page, on Avenue des Arbanais in Giens. */
export const PROSPECT_MAP = {
	latitude: 43.037673,
	longitude: 6.145289,
	zoom: 18,
} as const;

export function prospectMapEmbedUrl(locale: string): string {
	const language = locale === "fr" ? "fr" : "de";
	const query = `${PROSPECT_MAP.latitude},${PROSPECT_MAP.longitude}`;
	return `https://maps.google.com/maps?q=${query}&z=${PROSPECT_MAP.zoom}&hl=${language}&output=embed`;
}

export function prospectMapLink(): string {
	const query = `${PROSPECT_MAP.latitude},${PROSPECT_MAP.longitude}`;
	return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
