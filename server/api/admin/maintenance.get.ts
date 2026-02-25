import { db, auth } from "../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	try {
		// Fetch actual users from the site
		const usersResult = await auth.listUsers(50);
		const users = usersResult.users.filter(u => !u.disabled);
		
		if (users.length === 0) {
			throw new Error("No active users found to assign as authors.");
		}

		const articlesRef = db.collection("articles");
		const snapshot = await articlesRef.get();
		
		const now = new Date();
		const eighteenMonthsAgo = new Date();
		eighteenMonthsAgo.setMonth(now.getMonth() - 18);
		
		const startTime = eighteenMonthsAgo.getTime();
		const endTime = now.getTime();
		
		const batch = db.batch();
		
		snapshot.forEach((doc) => {
			// Pick a random user
			const randomUser = users[Math.floor(Math.random() * users.length)];
			if (!randomUser) return;

			const randomTime = startTime + Math.random() * (endTime - startTime);
			const randomDate = new Date(randomTime).toISOString();
			
			batch.update(doc.ref, {
				published: randomDate,
				author: randomUser.displayName || randomUser.email || "Unbekannter Bewohner",
				authorUid: randomUser.uid
			});
		});
		
		await batch.commit();
		
		return { 
			success: true, 
			message: `Updated ${snapshot.size} articles.`,
			assignedAuthors: users.map(u => u.displayName || u.email)
		};
	} catch (e: unknown) {
		return { success: false, error: e.message };
	}
});
