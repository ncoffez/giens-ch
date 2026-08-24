const DEFAULT_SITE_URL = "https://giens.ch";

export function getSiteUrl(siteUrl?: string): string {
	return (siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function buildAbsoluteSiteUrl(path: string, siteUrl?: string): string {
	if (/^https?:\/\//i.test(path)) return path;
	return new URL(path.startsWith("/") ? path : `/${path}`, getSiteUrl(siteUrl)).toString();
}
