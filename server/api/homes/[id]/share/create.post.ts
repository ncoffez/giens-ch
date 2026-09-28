import { createShareLink } from "../../../../utils/homes";
import { assertHomeSection } from "../../../../utils/permissionAccess";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");
	const body = await readBody(event);

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	const { claims } = await assertHomeSection(event, homeId, "home.links.manage");

	const daysToExpire = body.daysToExpire || 7;
	const share = await createShareLink(homeId, claims.uid, daysToExpire);

	// Generate the full share URL
	const siteUrl = useRuntimeConfig().public.SITE_URL || "https://giens.ch";
	const shareUrl = `${siteUrl}/homes/share/${share.id}`;

	return { share, shareUrl };
});
