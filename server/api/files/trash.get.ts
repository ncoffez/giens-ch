import { auth, db, storage } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import { canAdminGlobalDocuments } from "../../utils/fileAccess";

const SIGNED_URL_EXPIRY_MINUTES = 5;

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!canAdminGlobalDocuments(claims)) {
		throw createError({ statusCode: 403, message: "Only admins can view trash" });
	}

	const filesSnapshot = await db.collection("globalFiles").where("deletedAt", "!=", null).get();

	const bucket = storage.bucket();
	const deletedByIds = new Set<string>();
	filesSnapshot.docs.forEach((doc) => {
		const data = doc.data();
		if (data.deletedBy) {
			deletedByIds.add(data.deletedBy);
		}
	});

	const deletedByLabels = new Map<string, string>();
	await Promise.all(
		Array.from(deletedByIds).map(async (uid) => {
			try {
				const [userDoc, userRecord] = await Promise.all([
					db.collection("users").doc(uid).get(),
					auth.getUser(uid),
				]);
				const firestoreData = userDoc.exists ? userDoc.data() : null;
				const label = firestoreData?.displayName || firestoreData?.email || userRecord.displayName || userRecord.email || uid;
				deletedByLabels.set(uid, label);
			} catch {
				deletedByLabels.set(uid, uid);
			}
		})
	);

	const files = await Promise.all(
		filesSnapshot.docs.map(async (doc) => {
			const data = doc.data();
			let url = null;

			if (data.storagePath) {
				try {
					const file = bucket.file(data.storagePath);
					[url] = await file.getSignedUrl({
						action: "read",
						expires: Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60 * 1000,
					});
				} catch (e: unknown) {
					console.error("Error generating signed URL:", e);
				}
			}

			return {
				...data,
				url,
				deletedByLabel: data.deletedBy ? deletedByLabels.get(data.deletedBy) || data.deletedBy : null,
			};
		})
	);

	return { files };
});
