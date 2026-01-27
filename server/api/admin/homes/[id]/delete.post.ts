import { db } from "../../../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	try {
		const claims = await getUserClaims(event);

		if (!claims || !claims.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Admin access required" });
		}

		const homeId = getRouterParam(event, "id");

		if (!homeId) {
			throw createError({ statusCode: 400, message: "Home ID is required" });
		}

		await db.collection("homes").doc(homeId).delete();

		return { success: true };
	} catch (e: any) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});