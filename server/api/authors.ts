import { db } from "../useFirebaseAdmin";

export default defineEventHandler(async (_event) => {
	try {
		const querySnapshot = await db.collection("articles").get();
		const authorsMap = new Map<string, string>(); // uid -> name
		
		querySnapshot.forEach((doc) => {
			const data = doc.data();
			if (data.authorUid && data.author) {
				authorsMap.set(data.authorUid, data.author);
			} else if (data.author) {
				// Fallback for articles with author name but no UID
				authorsMap.set(data.author, data.author);
			}
		});
		
		const authors = Array.from(authorsMap.entries()).map(([id, name]) => ({
			id,
			name
		}));
		
		return authors.sort((a, b) => a.name.localeCompare(b.name));
	} catch (e) {
		return [];
	}
});
