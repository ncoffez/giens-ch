import { storage } from "../../../../../useFirebaseAdmin";
import { getHomeById, getShareLink } from "../../../../../utils/homes";

const SIGNED_URL_EXPIRY_MINUTES = 15;

export default defineEventHandler(async (event) => {
	const token = getRouterParam(event, "token");
	const fileId = getQuery(event).fileId as string | undefined;

	if (!token || !fileId) {
		throw createError({ statusCode: 400, message: "Share token and file ID are required" });
	}

	const share = await getShareLink(token);
	if (!share) {
		throw createError({ statusCode: 404, message: "Share link not found, expired, or revoked" });
	}

	const home = await getHomeById(share.homeId);
	if (!home) {
		throw createError({ statusCode: 404, message: "Home not found" });
	}

	const file = (home.files || []).find((entry) => entry.id === fileId);
	if (!file?.storagePath) {
		throw createError({ statusCode: 404, message: "File not found" });
	}

	const [url] = await storage.bucket().file(file.storagePath).getSignedUrl({
		action: "read",
		expires: Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60 * 1000,
	});

	return { url };
});
