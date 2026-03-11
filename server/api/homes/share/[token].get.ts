import { getHomeById } from "../../../utils/homes";
import { getShareLink, incrementShareAccess } from "../../../utils/homes";

export default defineEventHandler(async (event) => {
	const token = getRouterParam(event, "token");

	if (!token) {
		throw createError({ statusCode: 400, message: "Share token is required" });
	}

	const share = await getShareLink(token);
	if (!share) {
		throw createError({
			statusCode: 404,
			message: "Share link not found, expired, or revoked",
		});
	}

	const home = await getHomeById(share.homeId);
	if (!home) {
		throw createError({ statusCode: 404, message: "Home not found" });
	}

	// Increment access count
	await incrementShareAccess(token);

	return { home, share };
});
