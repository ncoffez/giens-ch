export function htmlForLocale(locale: string, copy: { de: string; fr: string }): string {
	return locale === "fr" ? copy.fr : copy.de;
}
