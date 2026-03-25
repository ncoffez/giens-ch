import { loadContentSearchIndex } from "../utils/siteSearch";

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const locale = (query.locale as string) || "de";
	return loadContentSearchIndex(locale);
});
