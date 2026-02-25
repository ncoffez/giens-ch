import { db } from "../../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	try {
		const claims = await getUserClaims(event);

		if (!claims || !claims.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Admin access required" });
		}

		const query = db.collection("homes").orderBy("name");
		const snapshot = await query.get();
		const homes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

		return homes;
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});