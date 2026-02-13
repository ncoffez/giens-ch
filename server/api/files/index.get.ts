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

	const filesSnapshot = await db.collection("globalFiles").get();
	const foldersSnapshot = await db.collection("globalFolders").get();

	const bucket = storage.bucket();

	const files = await Promise.all(
		filesSnapshot.docs
			.filter((doc) => !doc.data().deletedAt)
			.map(async (doc) => {
			const data = doc.data();
			let url = null;

			if (data.storagePath) {
				try {
					const file = bucket.file(data.storagePath);
					[url] = await file.getSignedUrl({
						action: "read",
						expires: Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60 * 1000,
					});
				} catch (e) {
					console.error("Error generating signed URL:", e);
				}
			}

			return {
				...data,
				url,
			};
		})
	);

	const folders = foldersSnapshot.docs.map((doc) => doc.data());

	return { files, folders };
});
