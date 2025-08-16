import { news } from "../news";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);
		const label = body.label || "public";
		const tag = body.tag;
		const quantity = body.quantity || 1;
		// const name = getRouterParam(event, 'name') //server/api/hello/[name].ts

		if (isNaN(body.quantity)) throw new Error(`quantity must be a number.`);
		if (body.quantity < 1) throw new Error(`quantity must be greater than 1.`);

		let latestNews = news.filter((article) => article.label.includes(label));

		if (tag) {
			latestNews = latestNews.filter((article) => article.tags.map((tag) => tag.toLowerCase()).includes(tag));
		}

		return latestNews
			.sort((a, b) => {
				return new Date(b.published).getTime() - new Date(a.published).getTime();
			})
			.slice(0, quantity);
	} catch (error: any) {
		return {
			data: null,
			error: true,
			message: error?.message || "Unknown error",
			statusCode: 500,
		};
	}
});
