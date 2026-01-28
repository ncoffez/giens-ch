import { db } from "../../useFirebaseAdmin";
import { getHomes } from "../../utils/homes";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	console.log('[Homes API] Request received');

	try {
		const claims = await getUserClaims(event);
		if (!claims) {
			console.log('[Homes API] No claims found');
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		console.log('[Homes API] UID:', claims.uid);
		const homes = await getHomes(claims.uid);
		const enabled = homes.filter((home) => home.enabled);
		console.log('[Homes API] Returning', enabled.length, 'homes');

		return enabled;
	} catch (e: any) {
		console.error('[Homes API] Error:', e.message);
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});