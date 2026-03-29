import { isHomeOwner } from "../../../../utils/homes";
import { revokeShareLink } from "../../../../utils/homes";
import { getUserClaims } from "../../../../utils/auth";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");
	const body = await readBody(event);

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	if (!body.shareId) {
		throw createError({ statusCode: 400, message: "Share ID is required" });
	}

	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const isOwner = await isHomeOwner(homeId, claims.uid);

	if (!isOwner) {
		throw createError({
			statusCode: 403,
			message: "Forbidden: You cannot revoke share links for this home",
		});
	}

	await revokeShareLink(body.shareId);
	return { success: true };
});
