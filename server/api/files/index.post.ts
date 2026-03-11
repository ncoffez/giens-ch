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

const getResizedPath = (originalPath: string, size: string): string => {
	const pathParts = originalPath.split("/");
	const fileName = pathParts.pop() || "";
	const dirPath = pathParts.join("/");
	const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
	return `${dirPath}/resized/${nameWithoutExt}_${size}.webp`;
};

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!claims.reader && !claims.owner && !claims.admin) {
		throw createError({ statusCode: 403, message: "Access denied" });
	}

	const body = await readBody(event).catch(() => ({}));
	const { folderId } = body;

	let filesQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection("globalFiles");

	if (folderId !== undefined) {
		filesQuery = filesQuery.where("folderId", "==", folderId || null);
	}

	const [filesSnapshot, foldersSnapshot] = await Promise.all([
		filesQuery.get(),
		db.collection("globalFolders").get(),
	]);

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
		const userDocs = await Promise.all(
			Array.from(userIds).map((uid) =>
				db.collection("users").doc(uid).get().then((doc) => ({ uid, data: doc.data() }))
			)
		);

		for (const { uid, data } of userDocs) {
			if (data?.displayName) {
				userNames[uid] = data.displayName;
			} else {
				try {
					const userRecord = await auth.getUser(uid);
					if (userRecord.displayName) {
						userNames[uid] = userRecord.displayName;
					}
				} catch {
				}
			}
		}
	}

	const files = await Promise.all(
		rawFiles.map(async (data) => {
			const url = data.storagePath ? await generateSignedUrl(bucket, data.storagePath) : null;

			let thumbnailUrl: string | null = null;
			let optimizedUrl: string | null = null;

			if (data.storagePath && data.type?.startsWith("image/")) {
				const thumbnailPath = getResizedPath(data.storagePath, "400x400");
				const optimizedPath = getResizedPath(data.storagePath, "1920x1920");

				const [thumbnailExists] = await bucket.file(thumbnailPath).exists();
				const [optimizedExists] = await bucket.file(optimizedPath).exists();

				if (thumbnailExists) {
					thumbnailUrl = await generateSignedUrl(bucket, thumbnailPath);
				}
				if (optimizedExists) {
					optimizedUrl = await generateSignedUrl(bucket, optimizedPath);
				}
			}

			return {
				id: data.id,
				name: data.name,
				type: data.type,
				size: data.size,
				url,
				thumbnailUrl,
				optimizedUrl,
				folderId: data.folderId,
				uploadedAt: data.uploadedAt,
				uploadedBy: data.uploadedBy,
				uploadedByName: data.uploadedBy ? userNames[data.uploadedBy] : undefined,
				lastModified: data.lastModified,
				storagePath: data.storagePath,
			};
		})
	);

	const folders = rawFolders.map((data) => ({
		...data,
		createdByName: data.createdBy ? userNames[data.createdBy] : undefined,
	}));

	return { files, folders };
});