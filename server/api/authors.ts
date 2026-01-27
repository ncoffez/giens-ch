import { db } from "../useFirebaseAdmin";

export default defineEventHandler(async (_event) => {
	try {
		const querySnapshot = await db.collection("articles").get();
		const authors = new Set<string>();
		querySnapshot.forEach((doc) => {
			const data = doc.data();
			if (data.author) {
				authors.add(data.author);
			}
		});
		return Array.from(authors).sort();
	} catch (e) {
		return [];
	}
});
