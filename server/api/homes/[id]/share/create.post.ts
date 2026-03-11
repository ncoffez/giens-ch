import { isHomeOwner } from "../../../../utils/homes";
import { createShareLink } from "../../../../utils/homes";
import { getUserClaims } from "../../../../utils/auth";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");
	const body = await readBody(event);

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const isAdmin = !!claims.admin;
	const isOwner = await isHomeOwner(homeId, claims.uid);

	if (!isAdmin && !isOwner) {
		throw createError({
			statusCode: 403,
			message: "Forbidden: You cannot create share links for this home",
		});
	}

	const daysToExpire = body.daysToExpire || 7;
	const share = await createShareLink(homeId, claims.uid, daysToExpire);

	// Generate the full share URL
	const shareUrl = `https://giens-ch.web.app/homes/share/${share.id}`;

	return { share, shareUrl };
});
