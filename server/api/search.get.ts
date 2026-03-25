import { getUserClaims } from "../utils/auth";
import { buildUnifiedSearchResults } from "../utils/siteSearch";

export default defineEventHandler(async (event) => {
	const query = ((getQuery(event).q as string) || "").trim();
	const locale = ((getQuery(event).locale as string) || "de").trim();

	if (!query) {
		return { results: [] };
	}

	const claims = await getUserClaims(event);
	const results = await buildUnifiedSearchResults(query, { locale, claims });

	return { results };
});
