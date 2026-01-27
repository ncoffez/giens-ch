import { auth, db } from "../../useFirebaseAdmin";
import { Article } from "../../../types";

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
		// Fallback: If UID lookup fails, check if we have any articles with this name as authorUid or author
		const fallbackSnapshot = await db.collection("articles")
			.where("author", "==", uid)
			.limit(1)
			.get();
		
		if (fallbackSnapshot.empty) {
			// Second attempt: check if any article has this as authorUid but the user doesn't exist in Auth anymore
			const secondFallback = await db.collection("articles")
				.where("authorUid", "==", uid)
				.limit(1)
				.get();
			
			if (secondFallback.empty) {
				throw createError({ statusCode: 404, message: "User not found" });
			}
			const doc = secondFallback.docs[0];
			if (doc) {
				userData.displayName = doc.data().author || uid;
			} else {
				userData.displayName = uid;
			}
		} else {
			userData.displayName = uid;
		}
	}

	try {
		// Fetch articles by this author
		// Note: We avoid .orderBy() here to prevent "Missing Index" errors if the composite index isn't set up yet.
		// We will sort in-memory since we only limit to a small number.
		const articlesSnapshot = await db.collection("articles")
			.where("authorUid", "==", uid)
			.limit(100)
			.get();
		
		let articles: Article[] = [];
		articlesSnapshot.forEach(doc => {
			articles.push({ id: doc.id, ...doc.data() } as Article);
		});

		// If no articles found by UID, try by author name as fallback
		if (articles.length === 0) {
			const articlesByName = await db.collection("articles")
				.where("author", "==", userData.displayName)
				.limit(100)
				.get();
			
			articlesByName.forEach(doc => {
				if (!articles.find(a => a.id === doc.id)) {
					articles.push({ id: doc.id, ...doc.data() } as Article);
				}
			});
		}

		// Sort in memory by published date descending
		articles.sort((a, b) => {
			const dateA = new Date(a.published).getTime();
			const dateB = new Date(b.published).getTime();
			return dateB - dateA;
		});

		return {
			...userData,
			articles: articles.slice(0, 20)
		};
	} catch (e: any) {
		console.error("Profile API Error:", e);
		throw createError({ statusCode: 500, message: "Error fetching user articles: " + e.message });
	}
});
