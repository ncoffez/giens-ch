import { db, auth } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";

// Helper function to remove body from article objects (metadata public, body gated by claims)
function stripBodyFromArticle(article: any) {
	const { body, ...articleWithoutBody } = article;
	return articleWithoutBody;
}

export default defineEventHandler(async (event) => {
	try {
		console.log('[Private Profile API] Request received');
		const claims = await getUserClaims(event);

		if (!claims) {
			console.log('[Private Profile API] No claims found, returning 401');
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		console.log('[Private Profile API] Claims found:', { uid: claims.uid });

		const { page } = getQuery(event);
		const pageSize = 5;
		const currentPage = typeof page === "string" ? parseInt(page, 10) : 1;

		// Query articles by authorUid first (for newer articles)
		let query = db
			.collection("articles")
			.where("authorUid", "==", claims.uid)
			.where("published", "<=", new Date().toISOString())
			.orderBy("published", "desc");

		if (currentPage > 1) {
			// Fetch previous pages to get cursor position
			const prevSnapshot = await query.limit((currentPage - 1) * pageSize).get();
			if (!prevSnapshot.empty) {
				const lastDoc = prevSnapshot.docs[prevSnapshot.docs.length - 1];
				query = query.startAfter(lastDoc);
			}
		}

		const snapshot = await query.limit(pageSize).get();
		let articles = snapshot.docs.map((doc) => stripBodyFromArticle(doc.data()));

		// Fallback for articles created before authorUid was tracked
		if (articles.length === 0) {
			console.log('[Private Profile API] No articles by UID, checking fallback by author name');
			const userRecord = await auth.getUser(claims.uid);
			const displayName = userRecord?.displayName || userRecord?.email || "";
			
			if (displayName) {
				let fallbackQuery = db
					.collection("articles")
					.where("author", "==", displayName)
					.where("published", "<=", new Date().toISOString())
					.orderBy("published", "desc");
				
				if (currentPage > 1) {
					const prevFallbackSnapshot = await fallbackQuery.limit((currentPage - 1) * pageSize).get();
					if (!prevFallbackSnapshot.empty) {
						const lastDoc = prevFallbackSnapshot.docs[prevFallbackSnapshot.docs.length - 1];
						fallbackQuery = fallbackQuery.startAfter(lastDoc);
					}
				}
				
				const fallbackSnapshot = await fallbackQuery.limit(pageSize).get();
				fallbackSnapshot.forEach((doc) => {
					articles.push(stripBodyFromArticle(doc.data()));
				});
			}
		}

		console.log(`[Private Profile API] Returning ${articles.length} articles for UID: ${claims.uid}`);

		return {
			articles,
			pagination: {
				page: currentPage,
				pageSize,
				total: articles.length,
			},
		};
	} catch (e: any) {
		console.error('[Private Profile API] Error:', e.message);
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});