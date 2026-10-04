import { renewProspectShare } from "../../../../utils/homes";
import { assertHomeSection } from "../../../../utils/permissionAccess";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	const { claims } = await assertHomeSection(event, homeId, "home.links.manage");
	const share = await renewProspectShare(homeId, claims.uid || "");
	const siteUrl = useRuntimeConfig().public.SITE_URL || "https://giens.ch";

	return {
		share,
		shareUrl: `${siteUrl}/homes/share/${share.id}`,
	};
});
