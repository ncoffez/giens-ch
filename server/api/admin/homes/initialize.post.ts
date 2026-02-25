import { db } from "../../../useFirebaseAdmin";
import { initializeHomes } from "../../../utils/homeInit";

export default defineEventHandler(async (event) => {
	try {
		const claims = await getUserClaims(event);

		if (!claims || !claims.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Admin access required" });
		}

		const { maxHomeNumber } = getQuery(event);
		const result = await initializeHomes(Number(maxHomeNumber) || 30);

		return {
			created: result.created,
			existing: result.existing,
			total: result.created + result.existing,
		};
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});