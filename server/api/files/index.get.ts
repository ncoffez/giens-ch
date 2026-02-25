import { db, storage, auth } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";

const SIGNED_URL_EXPIRY_MINUTES = 60;

const generateSignedUrl = async (bucket: ReturnType<typeof storage.bucket>, path: string): Promise<string | null> => {
	try {
		const file = bucket.file(path);
		const [url] = await file.getSignedUrl({
			action: "read",
			expires: Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60 * 1000,
		});
		return url;
	} catch {
		return null;
	}
};

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

	const rawFiles = filesSnapshot.docs
		.filter((doc) => !doc.data().deletedAt)
		.map((doc) => doc.data());

	const rawFolders = foldersSnapshot.docs.map((doc) => doc.data());

	const userIds = new Set<string>();
	rawFiles.forEach((f) => {
		if (f.uploadedBy) userIds.add(f.uploadedBy);
	});
	rawFolders.forEach((f) => {
		if (f.createdBy) userIds.add(f.createdBy);
	});

	const userNames: Record<string, string> = {};
	if (userIds.size > 0) {
		const firestoreUsersSnapshot = await db.collection("users").get();
		const firestoreUsersMap = new Map<string, { displayName?: string }>();
		firestoreUsersSnapshot.forEach((doc) => {
			firestoreUsersMap.set(doc.id, doc.data() as { displayName?: string });
		});

		for (const uid of userIds) {
			let displayName: string | undefined;
			const firestoreData = firestoreUsersMap.get(uid);
			if (firestoreData?.displayName) {
				displayName = firestoreData.displayName;
			} else {
				try {
					const userRecord = await auth.getUser(uid);
					displayName = userRecord.displayName || undefined;
				} catch {
				}
			}
			if (displayName) {
				userNames[uid] = displayName;
			}
		}
	}

	const files = await Promise.all(
		rawFiles.map(async (data) => {
			const url = data.storagePath ? await generateSignedUrl(bucket, data.storagePath) : null;
			const thumbnailUrl = data.thumbnailPath ? await generateSignedUrl(bucket, data.thumbnailPath) : null;
			const optimizedUrl = data.optimizedPath ? await generateSignedUrl(bucket, data.optimizedPath) : null;

			return {
				...data,
				url,
				thumbnailUrl,
				optimizedUrl,
				uploadedByName: data.uploadedBy ? userNames[data.uploadedBy] : undefined,
			};
		})
	);

	const folders = rawFolders.map((data) => ({
		...data,
		createdByName: data.createdBy ? userNames[data.createdBy] : undefined,
	}));

	return { files, folders };
});
