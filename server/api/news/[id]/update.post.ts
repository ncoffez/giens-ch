import { db, auth } from "../../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];

		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const decodedToken = await auth.verifyIdToken(idToken);
		
		if (!decodedToken.publisher && !decodedToken.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Not a publisher" });
		}

		const articleId = getRouterParam(event, "id");
		if (!articleId) {
			throw createError({ statusCode: 400, message: "Article ID required" });
		}

		const articleRef = db.collection("articles").doc(articleId);
		const articleDoc = await articleRef.get();

		if (!articleDoc.exists) {
			throw createError({ statusCode: 404, message: "Article not found" });
		}

		const updateData: Record<string, any> = {
			title: body.title,
			intro: body.intro || "",
			body: body.body,
			image: body.image || "",
			tags: body.tags || [],
			updatedAt: new Date().toISOString(),
			hasAttachments: body.body?.includes('class="document-link"') || false
		};

		// Admins can change author
		if (decodedToken.admin && body.authorName && body.authorUid) {
			updateData.author = body.authorName;
			updateData.authorUid = body.authorUid;
		}

		await articleRef.update(updateData);

		return { id: articleId, ...updateData };
	} catch (e: any) {
		throw createError({ 
			statusCode: e.statusCode || 500, 
			message: e.message || "Internal Server Error" 
		});
	}
});