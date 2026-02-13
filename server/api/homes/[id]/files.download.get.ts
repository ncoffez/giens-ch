import { db, storage } from "../../../useFirebaseAdmin";
import { getUserClaims } from "../../../utils/auth";
import { canEditHome } from "../../../utils/homes";

const SIGNED_URL_EXPIRY_MINUTES = 5;

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const homeId = getRouterParam(event, "id");
	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID required" });
	}

	const homeDoc = await db.collection("homes").doc(homeId).get();
	if (!homeDoc.exists) {
		throw createError({ statusCode: 404, message: "Home not found" });
	}

	const homeData = homeDoc.data();
	const isOwner = homeData?.ownerIds?.includes(claims.uid);
	const isEditor = homeData?.editors?.includes(claims.uid);
	const isAdmin = claims.admin;

	if (!isOwner && !isEditor && !isAdmin) {
		throw createError({ statusCode: 403, message: "Not authorized to view this home's files" });
	}

	const fileId = getQuery(event).fileId as string;
	if (!fileId) {
		throw createError({ statusCode: 400, message: "File ID is required" });
	}

	const files = homeData?.files || [];
	const file = files.find((f: any) => f.id === fileId);

	if (!file) {
		throw createError({ statusCode: 404, message: "File not found" });
	}

	if (!file.storagePath) {
		throw createError({ statusCode: 500, message: "File storage path not found" });
	}

	const bucket = storage.bucket();
	const storageFile = bucket.file(file.storagePath);

	const [signedUrl] = await storageFile.getSignedUrl({
		action: "read",
		expires: Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60 * 1000,
	});

	return { url: signedUrl };
});
