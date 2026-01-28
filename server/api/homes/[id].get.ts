import { db } from "../../useFirebaseAdmin";
import { getHomeById } from "../../utils/homes";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	try {
		const homeId = getRouterParam(event, "id");

		if (!homeId) {
			throw createError({ statusCode: 400, message: "Home ID is required" });
		}

		const claims = await getUserClaims(event);
		if (!claims) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const home = await getHomeById(homeId);

		if (!home) {
			throw createError({ statusCode: 404, message: "Home not found" });
		}

		const isOwner = home.ownerIds.includes(claims.uid);
		const isEditor = home.editors.includes(claims.uid);
		const isAdmin = !!claims.admin || !!claims.owner;

		if (!isOwner && !isEditor && !isAdmin) {
			throw createError({ statusCode: 403, message: "Forbidden: You don't have access to this home" });
		}

		return home;
	} catch (e: any) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});