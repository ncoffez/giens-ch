import { news } from "../news";
import { Article } from "../utils/article";

export default defineEventHandler(async (event) => {
	try {
		const { permission, tag, quantity } = await readBody(event);
		console.log(`Received request for news with permission: ${permission}, tag: ${tag}, quantity: ${quantity}`);

		if (isNaN(quantity)) throw new Error(`quantity must be a number.`);
		if (quantity < 1) throw new Error(`quantity must be greater than 1.`);

		const labels = await $fetch("/api/labels");
		let latestNews = filterByPermission(permission, news, labels);
		if (tag) latestNews = filterByTag(tag, latestNews);
		console.log(`Found ${latestNews.length} matching articles.`);

		latestNews = sortByDate(latestNews).slice(0, quantity);
		return latestNews;
	} catch (e: any) {
		return { data: null, error: true, message: e?.message, statusCode: 500 };
	}
});

function filterByPermission(permission: "public" | "private", articles: Article[], labels: any[]) {
	if (permission === "private") return articles;
	return articles.filter((article) => {
		return article.tags.every((tag) => !isPrivateTag(tag, labels));
	});
}

function filterByTag(tag: string, articles: Article[]) {
	return articles.filter((article) => article.tags.map((tag) => tag.toLowerCase()).includes(tag));
}

function sortByDate(articles: Article[]) {
	return articles.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
}

function isPrivateTag(tag: string, labels: any[]) {
	const label = labels.find((label) => label?.id === tag.toLowerCase());
	if (!label) return undefined;
	return label.private;
}
