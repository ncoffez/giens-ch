import { db, storage } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";

const SIGNED_URL_EXPIRY_MINUTES = 5;

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!claims.reader && !claims.owner && !claims.admin) {
		throw createError({ statusCode: 403, message: "Access denied" });
	}

	const fileId = getQuery(event).fileId as string;
	if (!fileId) {
		throw createError({ statusCode: 400, message: "File ID is required" });
	}

	const fileDoc = await db.collection("globalFiles").doc(fileId).get();
	if (!fileDoc.exists) {
		throw createError({ statusCode: 404, message: "File not found" });
	}

	const fileData = fileDoc.data();
	if (!fileData?.storagePath) {
		throw createError({ statusCode: 500, message: "File storage path not found" });
	}

	const bucket = storage.bucket();
	const file = bucket.file(fileData.storagePath);

	const [signedUrl] = await file.getSignedUrl({
		action: "read",
		expires: Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60 * 1000,
	});

	return { url: signedUrl };
});
