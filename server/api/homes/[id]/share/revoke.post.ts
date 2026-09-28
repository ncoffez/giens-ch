import { revokeShareLink } from "../../../../utils/homes";
import { assertHomeSection } from "../../../../utils/permissionAccess";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");
	const body = await readBody(event);

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	if (!body.shareId) {
		throw createError({ statusCode: 400, message: "Share ID is required" });
	}

	await assertHomeSection(event, homeId, "home.links.manage");

	await revokeShareLink(body.shareId);
	return { success: true };
});
