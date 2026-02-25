import { db } from "../../../../useFirebaseAdmin";
import { getUserClaims } from "../../../../utils/auth";

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

		const homeDoc = await db.collection("homes").doc(homeId).get();

		if (!homeDoc.exists) {
			throw createError({ statusCode: 404, message: "Home not found" });
		}

		return { id: homeDoc.id, ...homeDoc.data() };
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});