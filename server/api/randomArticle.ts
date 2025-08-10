
import { news } from "../news";

export default defineEventHandler(async (event) => {
  try {
	const articles = [
	  "eigentuemerversammlung-2025",
	  "lokales-fruehlingsfest-giens",
	  "nachwuchs-lotissement-beausoleil",
	  "neue-dokumente-veroeffentlicht",
	  "arbeitswoche-2025",
	  "neuer-miteigentuemer-beausoleil",
	  "sommerkonzert-giens",
	  "neue-garteninitiative-beausoleil",
	  "kunstmarkt-giens",
	  "aktualisierte-sicherheitsrichtlinien",
	  "beausoleil-gurken-fiasko",
	  "fischerfest-hyeres",
	  "mysterioeser-kater-carqueiranne",
	  "weinfest-la-londe-les-maures",
	];

	const body = await readBody(event);
	const id = articles[Math.floor(Math.random() * articles.length)];
	const label = body.label || "public";

	const article = news.find((article) => article.id === id);
	if (!article) throw new Error("This article is private.");
	if (article.label.includes("private") && label != "private") throw new Error(`Article with id ${id} is private.`);

	return article;
  } catch (error: any) {
	return {
	  data: null,
	  error: true,
	  message: error?.message || 'Unknown error',
	  statusCode: 500
	};
  }
});
