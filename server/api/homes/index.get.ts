import { db } from "../../useFirebaseAdmin";
import { getHomes } from "../../utils/homes";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	console.log('[Homes API] Request received');

	try {
		const authHeader = getHeader(event, "Authorization");
		console.log('[Homes API] Auth header exists:', !!authHeader);
		if (!authHeader) {
			console.log('[Homes API] Missing auth header');
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const claims = await getUserClaims(event);
		if (!claims) {
			console.log('[Homes API] No claims found');
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		console.log('[Homes API] UID:', claims.uid);
		console.log('[Homes API] Claims:', JSON.stringify({
			admin: claims.admin,
			owner: claims.owner,
			publisher: claims.publisher,
			reader: claims.reader
		}));

		const homes = await getHomes(claims.uid);
		console.log('[Homes API] Raw homes count:', homes.length);
		const enabled = homes.filter((home) => home.enabled);
		console.log('[Homes API] Returning', enabled.length, 'enabled homes');

		return enabled;
	} catch (e: any) {
		console.error('[Homes API] Error:', {
			message: e.message,
			statusCode: e.statusCode,
			stack: e.stack
		});
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});