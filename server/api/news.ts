import { db } from "../useFirebaseAdmin";
import { Article } from "../../types";
import { getUserPermission } from "../utils/auth";

// Helper function to remove body from article objects (metadata public, body gated by user claims)
function stripBodyFromArticle(article: any) {
	const { body, ...articleWithoutBody } = article;
	return articleWithoutBody;
}

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);
		const { tag, quantity, search, author, dateRange, all } = body;
		const permission = await getUserPermission(event);
		console.log(`API News: tag=${tag}, search=${search}, author=${author}, dateRange=${dateRange}, permission=${permission}, all=${all}`);

		const limitCount = all ? 1000 : 300;
		const querySnapshot = await db.collection("articles").orderBy("published", "desc").limit(limitCount).get();
		
		const articleMetadata: any[] = [];
		querySnapshot.forEach((doc) => {
			const article = doc.data();
			// Article metadata is ALWAYS PUBLIC, body is gated by user claims
			articleMetadata.push({
				id: doc.id,
				title: (article && article.title) || "",
				intro: (article && article.intro) || "",
				image: (article && article.image) || "",
				published: (article && article.published) || "",
				tags: (article && article.tags) || [],
				author: (article && article.author) || null,
				authorUid: (article && article.authorUid) || null,
				hasAttachments: (article && article.hasAttachments) || false,
				// Note: Body is no longer included - fetched separately on article detail page
			});
		});

		console.log(`Initial count: ${articleMetadata.length}`);
		let latestNews = articleMetadata;

		if (tag && tag !== 'all') {
			latestNews = filterByTag(tag, latestNews);
			console.log(`After tag (${tag}) filter: ${latestNews.length}`);
		}
		
		if (search && typeof search === 'string' && search.trim()) {
			latestNews = filterBySearch(search, latestNews);
			console.log(`After search (${search}) filter: ${latestNews.length}`);
		}
		
		if (author && author !== 'all') {
			latestNews = filterByAuthor(author, latestNews);
			console.log(`After author (${author}) filter: ${latestNews.length}`);
		}
		
		if (dateRange && dateRange !== 'all') {
			latestNews = filterByDateRange(dateRange, latestNews);
			console.log(`After dateRange (${dateRange}) filter: ${latestNews.length}`);
		}

		latestNews = latestNews.slice(0, quantity);
		console.log(`Returning ${latestNews.length} articles`);
		return latestNews;
	} catch (e: any) {
		console.error("Error in news API:", e);
		return { data: null, error: true, message: e?.message || "Unknown error", statusCode: 500 };
	}
});

function filterByTag(tag: string, articles: any[]) {
	if (tag === 'all') return articles;
	return articles.filter((article) => (article.tags || []).map((t: string) => t.toLowerCase()).includes(tag.toLowerCase()));
}

function filterBySearch(search: string, articles: any[]) {
	const query = search.toLowerCase().trim();
	if (!query) return articles;
	
	return articles.filter((article) => {
		const title = (article.title || "").toLowerCase();
		const intro = (article.intro || "").toLowerCase();
		const author = (article.author || "").toLowerCase();
		
		return title.includes(query) || 
			   intro.includes(query) || 
			   author.includes(query);
	});
}

function filterByAuthor(author: string, articles: any[]) {
	if (author === 'all') return articles;
	return articles.filter((article) => {
		return article.authorUid === author || article.author === author;
	});
}

function filterByDateRange(range: string, articles: any[]) {
	if (range === 'all') return articles;
	
	const now = new Date();
	let startDate: Date;
	
	try {
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
	
		const startTime = startDate.getTime();
		return articles.filter((article) => {
			if (!article.published) return false;
			const pubDate = new Date(article.published).getTime();
			return !isNaN(pubDate) && pubDate >= startTime;
		});
	} catch (e) {
		console.error("Error in filterByDateRange:", e);
		return articles;
	}
}