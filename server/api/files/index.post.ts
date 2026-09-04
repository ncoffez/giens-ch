import { db, storage, auth } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import { canReadGlobalDocuments } from "../../utils/fileAccess";

const SIGNED_URL_EXPIRY_MINUTES = 60;
const DEFAULT_LIMIT = 50;
const SIGNED_URL_CACHE_TTL_MS = 55 * 60 * 1000;
const USER_NAME_CACHE_TTL_MS = 10 * 60 * 1000;

const signedUrlCache = new Map<string, { value: string | null; expiresAt: number }>();
const fileExistsCache = new Map<string, { value: boolean; expiresAt: number }>();
const userNameCache = new Map<string, { value: string | null; expiresAt: number }>();

const getCachedValue = <T>(cache: Map<string, { value: T; expiresAt: number }>, key: string): T | undefined => {
	const cached = cache.get(key);
	if (!cached) return undefined;
	if (cached.expiresAt <= Date.now()) {
		cache.delete(key);
		return undefined;
	}
	return cached.value;
};

const setCachedValue = <T>(
	cache: Map<string, { value: T; expiresAt: number }>,
	key: string,
	value: T,
	ttlMs: number
) => {
	cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

const generateSignedUrl = async (bucket: ReturnType<typeof storage.bucket>, path: string): Promise<string | null> => {
	const cachedUrl = getCachedValue(signedUrlCache, path);
	if (cachedUrl !== undefined) {
		return cachedUrl;
	}

	try {
		const file = bucket.file(path);
		const [url] = await file.getSignedUrl({
			action: "read",
			expires: Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60 * 1000,
		});
		setCachedValue(signedUrlCache, path, url, SIGNED_URL_CACHE_TTL_MS);
		return url;
	} catch {
		setCachedValue(signedUrlCache, path, null, 60 * 1000);
		return null;
	}
};

const fileExists = async (bucket: ReturnType<typeof storage.bucket>, path: string) => {
	const cached = getCachedValue(fileExistsCache, path);
	if (cached !== undefined) {
		return cached;
	}

	const [exists] = await bucket.file(path).exists();
	setCachedValue(fileExistsCache, path, exists, 5 * 60 * 1000);
	return exists;
};

const getResizedPath = (originalPath: string, size: string): string => {
	const pathParts = originalPath.split("/");
	const fileName = pathParts.pop() || "";
	const dirPath = pathParts.join("/");
	const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
	return `${dirPath}/resized/${nameWithoutExt}_${size}.webp`;
};

interface FilesRequestBody {
	folderId?: string | null;
	limit?: number;
	cursor?: string | null;
	sortBy?: "name" | "date" | "size";
	sortOrder?: "asc" | "desc";
}

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!canReadGlobalDocuments(claims)) {
		throw createError({ statusCode: 403, message: "Access denied" });
	}

	const body = await readBody(event).catch(() => ({})) as FilesRequestBody | null;
	const { 
		folderId, 
		limit = DEFAULT_LIMIT, 
		cursor = null,
		sortBy = "date",
		sortOrder = "desc"
	} = body || {};

	const effectiveFolderId = folderId === undefined ? null : (folderId || null);

	const foldersSnapshot = await db.collection("globalFolders").get();
	const rawFolders = foldersSnapshot.docs.map((doc) => doc.data());

	let filesQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection("globalFiles");
	filesQuery = filesQuery.where("folderId", "==", effectiveFolderId);

	const sortField = sortBy === "date" ? "uploadedAt" : sortBy;
	filesQuery = filesQuery.orderBy(sortField, sortOrder);

	if (cursor) {
		const cursorDoc = await db.collection("globalFiles").doc(cursor).get();
		if (cursorDoc.exists) {
			filesQuery = filesQuery.startAfter(cursorDoc);
		}
	}

	filesQuery = filesQuery.limit(limit + 1);

	const filesSnapshot = await filesQuery.get();

	const bucket = storage.bucket();
	const rawFiles = filesSnapshot.docs
		.map((doc) => ({ id: doc.id, ...doc.data() }))
		.filter((doc: any) => !doc.deletedAt);

	const hasMore = rawFiles.length > limit;
	const filesToProcess = hasMore ? rawFiles.slice(0, limit) : rawFiles;
	const lastFile = filesToProcess.length > 0 ? filesToProcess[filesToProcess.length - 1] : null;
	const nextCursor = hasMore && lastFile ? (lastFile as any).id : null;

	const userIds = new Set<string>();
	filesToProcess.forEach((f: any) => {
		if (f.uploadedBy) userIds.add(f.uploadedBy);
	});
	rawFolders.forEach((f: any) => {
		if (f.createdBy) userIds.add(f.createdBy);
	});

	const userNames: Record<string, string> = {};
	if (userIds.size > 0) {
		const userDocs = await Promise.all(
			Array.from(userIds).map(async (uid) => {
				const cachedName = getCachedValue(userNameCache, uid);
				if (cachedName !== undefined) {
					return { uid, data: cachedName ? { displayName: cachedName } : undefined };
				}

				const doc = await db.collection("users").doc(uid).get();
				return { uid, data: doc.data() };
			})
		);

		await Promise.all(userDocs.map(async ({ uid, data }) => {
			if (data?.displayName) {
				userNames[uid] = data.displayName;
				setCachedValue(userNameCache, uid, data.displayName, USER_NAME_CACHE_TTL_MS);
				return;
			}

			try {
				const userRecord = await auth.getUser(uid);
				const displayName = userRecord.displayName || null;
				if (displayName) {
					userNames[uid] = displayName;
				}
				setCachedValue(userNameCache, uid, displayName, USER_NAME_CACHE_TTL_MS);
			} catch {
				setCachedValue(userNameCache, uid, null, USER_NAME_CACHE_TTL_MS);
			}
		}));
	}

	const files = await Promise.all(
		filesToProcess.map(async (data: any) => {
			const url = data.storagePath ? await generateSignedUrl(bucket, data.storagePath) : null;

			let thumbnailUrl: string | null = null;
			let optimizedUrl: string | null = null;

			if (data.storagePath && data.type?.startsWith("image/")) {
				const thumbnailPath = getResizedPath(data.storagePath, "400x400");
				const optimizedPath = getResizedPath(data.storagePath, "1920x1920");

				const [thumbnailExists, optimizedExists] = await Promise.all([
					fileExists(bucket, thumbnailPath),
					fileExists(bucket, optimizedPath),
				]);

				const [thumbnailSignedUrl, optimizedSignedUrl] = await Promise.all([
					thumbnailExists ? generateSignedUrl(bucket, thumbnailPath) : Promise.resolve(null),
					optimizedExists ? generateSignedUrl(bucket, optimizedPath) : Promise.resolve(null),
				]);

				thumbnailUrl = thumbnailSignedUrl;
				optimizedUrl = optimizedSignedUrl;
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

	const folders = rawFolders.map((data: any) => ({
		...data,
		createdByName: data.createdBy ? userNames[data.createdBy] : undefined,
	}));

	return { files, folders, nextCursor, hasMore };
});
