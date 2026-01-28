import { auth, db } from "../../useFirebaseAdmin";
import { Article } from "../../../types";

// Helper function to remove body from article objects (metadata public, body gated by claims)
function stripBodyFromArticle(article: any) {
	const { body, ...articleWithoutBody } = article;
	return articleWithoutBody;
}

export default defineEventHandler(async (event) => {
	const params = event.context.params as { uid?: string };
	const uidRaw = params?.uid;
	if (!uidRaw) {
		throw createError({ statusCode: 400, message: "Missing UID" });
	}
	const uid = uidRaw;

	let userData: { displayName: string; photoURL?: string } = {
		displayName: "Unbekannter Bewohner"
	};

	try {
		const user = await auth.getUser(uid);
		userData = {
			displayName: user.displayName || "Unbekannter Bewohner",
			photoURL: user.photoURL
		};
	} catch (e: any) {
		// User not found in Auth, check if they have any articles with this authorUid
		const articlesByUid = await db.collection("articles")
			.where("authorUid", "==", uid)
			.limit(1)
			.get();
		
		if (articlesByUid.empty) {
			// No articles found with this authorUid, search by author name as last resort
			const articlesByName = await db.collection("articles")
				.where("author", "==", uid)
				.limit(1)
				.get();
			
			if (articlesByName.empty) {
				throw createError({ statusCode: 404, message: "User not found" });
			}
			
			const doc = articlesByName.docs[0];
			if (doc) {
				userData.displayName = doc.data().author || uid;
			} else {
				userData.displayName = uid;
			}
		} else {
			const doc = articlesByUid.docs[0];
			if (doc) {
				userData.displayName = doc.data().author || uid;
			} else {
				userData.displayName = uid;
			}
		}
	}

	try {
		// Fetch articles by this author
		// Note: We avoid .orderBy() here to prevent "Missing Index" errors if the composite index isn't set up yet.
		// We will sort in-memory since we only limit to a small number.
		console.log(`[Public Profile API] Fetching articles for UID: ${uid}`);
		const articlesSnapshot = await db.collection("articles")
			.where("authorUid", "==", uid)
			.limit(100)
			.get();
		
let articles: Article[] = [];
		articlesSnapshot.forEach(doc => {
			articles.push(stripBodyFromArticle(doc.data()));
		});

		// If no articles found by UID, try by author name as fallback
		if (articles.length === 0) {
			const articlesByName = await db.collection("articles")
				.where("author", "==", userData.displayName)
				.limit(100)
				.get();
			
			articlesByName.forEach(doc => {
				const docId = doc.id;
				if (!articles.find((a: { id: string; }) => a.id === docId)) {
					articles.push(stripBodyFromArticle(doc.data()));
				}
			});
		}

		// Sort in memory by published date descending
		articles.sort((a, b) => {
			const dateA = new Date(a.published).getTime();
			const dateB = new Date(b.published).getTime();
			return dateB - dateA;
		});

		console.log(`[Public Profile API] Returning ${articles.length} articles for user: ${userData.displayName}`);
		console.log(`[Public Profile API] Article bodies: ${articles.some((a: Article) => a.body) ? 'Found body (error!)' : 'None (correct)'}`);

		return {
			...userData,
			articles: articles.slice(0, 20)
		};
	} catch (e: any) {
		console.error("Profile API Error:", e);
		throw createError({ statusCode: 500, message: "Error fetching user articles: " + e.message });
	}
});
