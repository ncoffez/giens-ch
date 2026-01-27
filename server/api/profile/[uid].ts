import { auth, db } from "../../useFirebaseAdmin";
import { Article } from "../../utils/article";

export default defineEventHandler(async (event) => {
	const uid = event.context.params?.uid;
	if (!uid) {
		throw createError({ statusCode: 400, message: "Missing UID" });
	}

	try {
		const user = await auth.getUser(uid);
		
		// Fetch articles by this author
		const articlesSnapshot = await db.collection("articles")
			.where("authorUid", "==", uid)
			.orderBy("published", "desc")
			.limit(20)
			.get();
			
		const articles: Article[] = [];
		articlesSnapshot.forEach(doc => {
			articles.push({ id: doc.id, ...doc.data() } as Article);
		});

		return {
			displayName: user.displayName || "Unbekannter Bewohner",
			photoURL: user.photoURL,
			articles
		};
	} catch (e: any) {
		throw createError({ statusCode: 404, message: "User not found" });
	}
});
