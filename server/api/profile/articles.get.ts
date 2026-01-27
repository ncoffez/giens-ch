import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	try {
		const claims = await getUserClaims(event);

		if (!claims) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const { page } = getQuery(event);
		const pageSize = 5;
		const currentPage = typeof page === "string" ? parseInt(page, 10) : 1;
		const offset = (currentPage - 1) * pageSize;

		let query = db
			.collection("articles")
			.where("authorUid", "==", claims.uid)
			.where("published", "<=", new Date().toISOString())
			.orderBy("published", "desc");

		if (offset > 0) {
			query = query.startAt(offset);
		}

		const snapshot = await query.limit(pageSize).get();
		const articles = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

		return {
			articles,
			pagination: {
				page: currentPage,
				pageSize,
				total: articles.length,
			},
		};
	} catch (e: any) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});