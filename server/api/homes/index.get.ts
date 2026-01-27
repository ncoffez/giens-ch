import { db } from "../../useFirebaseAdmin";
import { getHomes } from "../../utils/homes";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	try {
		const claims = await getUserClaims(event);

		if (!claims) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const homes = await getHomes(claims.uid);
		return homes.filter((home) => home.enabled);
	} catch (e: any) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});