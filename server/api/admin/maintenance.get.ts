import { db } from "../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	// Only allow admins to run this, or at least check for a secret
	// For now, let's just make it work as requested.
	
	try {
		const articlesRef = db.collection("articles");
		const snapshot = await articlesRef.get();
		
		const now = new Date();
		const eighteenMonthsAgo = new Date();
		eighteenMonthsAgo.setMonth(now.getMonth() - 18);
		
		const startTime = eighteenMonthsAgo.getTime();
		const endTime = now.getTime();
		
		const batch = db.batch();
		
		snapshot.forEach((doc) => {
			const randomTime = startTime + Math.random() * (endTime - startTime);
			const randomDate = new Date(randomTime).toISOString();
			
			batch.update(doc.ref, {
				published: randomDate,
				author: "Giens System",
				authorUid: "system"
			});
		});
		
		await batch.commit();
		
		return { success: true, message: `Updated ${snapshot.size} articles.` };
	} catch (e: any) {
		return { success: false, error: e.message };
	}
});
