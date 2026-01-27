import { db } from "../../useFirebaseAdmin";
import { getHomeById } from "../../utils/homes";

export default defineEventHandler(async (event) => {
	try {
		const homeId = getRouterParam(event, "id");

		if (!homeId) {
			throw createError({ statusCode: 400, message: "Home ID is required" });
		}

		const home = await getHomeById(homeId);

		if (!home) {
			throw createError({ statusCode: 404, message: "Home not found" });
		}

		return home;
	} catch (e: any) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});