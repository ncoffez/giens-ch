import { isHomeOwner } from "../../../../utils/homes";
import { getShareLinksForHome } from "../../../../utils/homes";
import { getUserClaims } from "../../../../utils/auth";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const isOwner = await isHomeOwner(homeId, claims.uid);

	if (!isOwner) {
		throw createError({
			statusCode: 403,
			message: "Forbidden: You cannot view share links for this home",
		});
	}

	const shares = await getShareLinksForHome(homeId);

	// Add share URLs
	const sharesWithUrls = shares.map((share) => ({
		...share,
		shareUrl: `https://giens-ch.web.app/homes/share/${share.id}`,
	}));

	return sharesWithUrls;
});
