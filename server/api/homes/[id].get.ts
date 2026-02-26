import { db, storage } from "../../useFirebaseAdmin";
import { getHomeById } from "../../utils/homes";
import { getUserClaims } from "../../utils/auth";

const SIGNED_URL_EXPIRY_MINUTES = 5;

export default defineEventHandler(async (event) => {
	try {
		const homeId = getRouterParam(event, "id");

		if (!homeId) {
			throw createError({ statusCode: 400, message: "Home ID is required" });
		}

		const claims = await getUserClaims(event);
		if (!claims) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const home = await getHomeById(homeId);

		if (!home) {
			throw createError({ statusCode: 404, message: "Home not found" });
		}

		const isOwner = home.ownerIds.includes(claims.uid);
		const isEditor = home.editors.includes(claims.uid);
		const isAdmin = !!claims.admin || !!claims.owner;

		if (!isOwner && !isEditor && !isAdmin) {
			throw createError({ statusCode: 403, message: "Forbidden: You don't have access to this home" });
		}

		if (home.files && home.files.length > 0) {
			const bucket = storage.bucket();
			home.files = await Promise.all(
				home.files.map(async (file: any) => {
					if (file.storagePath) {
						try {
							const storageFile = bucket.file(file.storagePath);
							const [url] = await storageFile.getSignedUrl({
								action: "read",
								expires: Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60 * 1000,
							});
							return { ...file, url };
						} catch (e: unknown) {
							console.error("Error generating signed URL for file:", e);
							return file;
						}
					}
					return file;
				})
			);
		}

		return home;
	} catch (e: unknown) {
		throw createError({
			statusCode: (e as { statusCode?: number }).statusCode || 500,
			message: e instanceof Error ? e.message : "Internal Server Error",
		});
	}
});
