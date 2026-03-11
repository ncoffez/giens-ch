import { getHomesForUser } from "../../utils/homes";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const homes = await getHomesForUser(claims.uid);
	return homes;
});
