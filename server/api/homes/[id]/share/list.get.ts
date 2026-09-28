import { getShareLinksForHome } from "../../../../utils/homes";
import { assertHomeSection } from "../../../../utils/permissionAccess";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	await assertHomeSection(event, homeId, "home.links.manage");

	const shares = await getShareLinksForHome(homeId);

	const siteUrl = useRuntimeConfig().public.SITE_URL || "https://giens.ch";

	// Add share URLs
	const sharesWithUrls = shares.map((share) => ({
		...share,
		shareUrl: `${siteUrl}/homes/share/${share.id}`,
	}));


	return sharesWithUrls;
});
