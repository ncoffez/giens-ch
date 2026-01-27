import { db } from "../useFirebaseAdmin";
import { Article } from "../utils/article";
import { getUserPermission } from "../utils/auth";

export default defineEventHandler(async (event) => {
	try {
		const { tag, quantity, search, author, dateRange } = await readBody(event);
		const permission = await getUserPermission(event);
		console.log(`Received request for news with permission (verified): ${permission}, tag: ${tag}, quantity: ${quantity}, search: ${search}`);

		if (isNaN(quantity)) throw new Error(`quantity must be a number.`);
		if (quantity < 1) throw new Error(`quantity must be greater than 1.`);

		// Optimization: Basic ordering server-side
		const querySnapshot = await db.collection("articles").orderBy("published", "desc").limit(100).get();
		const news: Article[] = [];
		querySnapshot.forEach((doc) => news.push({ id: doc.id, ...doc.data() } as Article));

		const labels = await $fetch("/api/labels");
		let latestNews = filterByPermission(permission, news, labels as any[]);
		
		if (tag) latestNews = filterByTag(tag, latestNews);
		if (search) latestNews = filterBySearch(search, latestNews);
		if (author) latestNews = filterByAuthor(author, latestNews);
		if (dateRange) latestNews = filterByDateRange(dateRange, latestNews);

		console.log(`Found ${latestNews.length} matching articles.`);

		latestNews = latestNews.slice(0, quantity);
		return latestNews;
	} catch (e: any) {
		return { data: null, error: true, message: e?.message, statusCode: 500 };
	}
});

function filterByPermission(permission: "public" | "private", articles: Article[], labels: any[]) {
	if (permission === "private") return articles;
	return articles.filter((article) => {
		return (article.tags || []).every((tag) => !isPrivateTag(tag, labels));
	});
}

function filterByTag(tag: string, articles: Article[]) {
	if (tag === 'all') return articles;
	return articles.filter((article) => (article.tags || []).map((t) => t.toLowerCase()).includes(tag.toLowerCase()));
}

function filterBySearch(search: string, articles: Article[]) {
	const query = search.toLowerCase();
	return articles.filter((article) => 
		article.title.toLowerCase().includes(query) || 
		article.intro.toLowerCase().includes(query) ||
		(article.author || '').toLowerCase().includes(query)
	);
}

function filterByAuthor(author: string, articles: Article[]) {
	if (author === 'all') return articles;
	return articles.filter((article) => article.authorUid === author || article.author === author);
}

function filterByDateRange(range: string, articles: Article[]) {
	const now = new Date();
	let startDate: Date;

	switch (range) {
		case 'this-month':
			startDate = new Date(now.getFullYear(), now.getMonth(), 1);
			break;
		case 'last-6-months':
			startDate = new Date();
			startDate.setMonth(now.getMonth() - 6);
			break;
		case 'this-year':
			startDate = new Date(now.getFullYear(), 0, 1);
			break;
		default:
			return articles;
	}

	return articles.filter((article) => new Date(article.published) >= startDate);
}

function sortByDate(articles: Article[]) {
	return articles.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
}

function isPrivateTag(tag: string, labels: any[]) {
	const label = labels.find((label) => label?.id === tag.toLowerCase());
	if (!label) return undefined;
	return label.private;
}
