import { storage } from "../../../../useFirebaseAdmin";
import { assertHomeSection } from "../../../../utils/permissionAccess";

const SIGNED_URL_EXPIRY_MINUTES = 15;

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");
	const fileId = getQuery(event).fileId as string | undefined;

	if (!homeId || !fileId) {
		throw createError({ statusCode: 400, message: "Home ID and file ID are required" });
	}

	const { home } = await assertHomeSection(event, homeId, "home.files.upload");

	const isPrivate = getQuery(event).private === "true";
	const file = (isPrivate ? (home.privateFiles || []) : (home.files || [])).find((entry) => entry.id === fileId);
	if (!file?.storagePath) {
		throw createError({ statusCode: 404, message: "File not found" });
	}

	const [url] = await storage.bucket().file(file.storagePath).getSignedUrl({
		action: "read",
		expires: Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60 * 1000,
	});

	return { url };
});
