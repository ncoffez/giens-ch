import { db, auth } from "../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];

		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const decodedToken = await auth.verifyIdToken(idToken);
		if (!decodedToken.admin) {
			throw createError({ statusCode: 403, message: "Admin only" });
		}

		console.log("[syncLabels] Starting labels sync...");

		const labelsSnapshot = await db.collection("labels").get();
		const existingLabelIds = new Set<string>();
		labelsSnapshot.forEach(doc => existingLabelIds.add(doc.id));

		const articlesSnapshot = await db.collection("articles").get();
		const allTags = new Set<string>();

		articlesSnapshot.forEach(doc => {
			const tags = doc.data().tags || [];
			tags.forEach((tag: string) => allTags.add(tag));
		});

		// Add miscellaneous label if not exists
		const miscLabelId = "sonstiges";
		existingLabelIds.add(miscLabelId);

		console.log(`[syncLabels] Existing labels: ${existingLabelIds.size}, Found tags: ${allTags.size}`);

		let createdCount = 0;
		const createdLabels: string[] = [];

		for (const tag of allTags) {
			if (!existingLabelIds.has(tag)) {
				await db.collection("labels").doc(tag).set({
					title: tag.charAt(0).toUpperCase() + tag.slice(1),
					name: tag,
					private: false
				});
				createdCount++;
				createdLabels.push(tag);
				console.log(`[syncLabels] Created label: ${tag}`);
			}
		}

		// Create miscellaneous label if needed
		if (!existingLabelIds.has("sonstiges")) {
			await db.collection("labels").doc("sonstiges").set({
				title: "Sonstiges",
				name: "sonstiges",
				private: false
			});
			createdCount++;
			createdLabels.push("sonstiges");
			console.log("[syncLabels] Created label: sonstiges");
		}

		return {
			success: true,
			message: `Sync complete. Created ${createdCount} new labels.`,
			createdLabels,
			totalExisting: existingLabelIds.size,
			totalTagsFound: allTags.size
		};
	} catch (e: any) {
		console.error("Sync labels error:", e);
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error"
		});
	}
});