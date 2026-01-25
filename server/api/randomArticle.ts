
import { db } from "../useFirebaseAdmin";
import { Article } from "../utils/article";
import { getUserPermission } from "../utils/auth";

export default defineEventHandler(async (event) => {
	try {
		const permission = await getUserPermission(event);
		
		const querySnapshot = await db.collection("articles").get();
		const news: any[] = [];
		querySnapshot.forEach((doc) => news.push({ id: doc.id, ...doc.data() }));

		const labels = await $fetch("/api/labels");
		
		// Filter by permission so we don't return private articles to public users
		const filteredNews = news.filter((article) => {
			if (permission === "private") return true;
			const isPrivate = article.tags.some((tag: string) => {
				const labelDoc = (labels as any[]).find((l: any) => l.id === tag.toLowerCase());
				return labelDoc?.private;
			});
			return !isPrivate;
		});

		if (filteredNews.length === 0) return null;
		
		const article = filteredNews[Math.floor(Math.random() * filteredNews.length)];
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
