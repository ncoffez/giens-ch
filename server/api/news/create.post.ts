import { db, auth } from "../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];

		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const decodedToken = await auth.verifyIdToken(idToken);
		
		// Check for publisher/admin claim
		if (!decodedToken.publisher && !decodedToken.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Not a publisher" });
		}

		// Admins can override author, others use their own identity
		let authorName = decodedToken.name || decodedToken.email || "Unknown";
		let authorUid = decodedToken.uid;

		if (decodedToken.admin && body.authorName && body.authorUid) {
			authorName = body.authorName;
			authorUid = body.authorUid;
		}

		const newArticle = {
			title: body.title,
			intro: body.intro || "",
			body: body.body,
			image: body.image || "",
			tags: body.tags || [],
			published: new Date().toISOString(),
			author: authorName,
			authorUid: authorUid,
			hasAttachments: body.body?.includes('class="document-link"') || false
		};

		const docRef = await db.collection("articles").add(newArticle);

		return { id: docRef.id, ...newArticle };
	} catch (e: any) {
		throw createError({ 
			statusCode: e.statusCode || 500, 
			message: e.message || "Internal Server Error" 
		});
	}
});
