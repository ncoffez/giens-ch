import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";

interface GlobalSearchFile {
	id: string;
	name: string;
	type: string;
	folderId: string | null;
	uploadedAt: string;
	deletedAt?: string;
}

interface GlobalSearchFolder {
	id: string;
	name: string;
	parentId: string | null;
}

const buildFolderPath = (foldersById: Map<string, GlobalSearchFolder>, folderId: string | null) => {
	if (!folderId) {
		return "";
	}

	const segments: string[] = [];
	let currentFolderId: string | null = folderId;

	while (currentFolderId) {
		const folder = foldersById.get(currentFolderId);
		if (!folder) {
			break;
		}

		segments.unshift(folder.name);
		currentFolderId = folder.parentId;
	}

	return segments.join(" / ");
};

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!claims.reader && !claims.publisher && !claims.owner && !claims.admin) {
		throw createError({ statusCode: 403, message: "Access denied" });
	}

	const [foldersSnapshot, filesSnapshot] = await Promise.all([
		db.collection("globalFolders").get(),
		db.collection("globalFiles").orderBy("uploadedAt", "desc").limit(500).get(),
	]);

	const folders = foldersSnapshot.docs.map((doc) => ({
		id: doc.id,
		...(doc.data() as Omit<GlobalSearchFolder, "id">),
	}));
	const foldersById = new Map(folders.map((folder) => [folder.id, folder]));

	const files = filesSnapshot.docs
		.map((doc) => ({
			id: doc.id,
			...(doc.data() as Omit<GlobalSearchFile, "id">),
		}))
		.filter((file) => !file.deletedAt)
		.map((file) => ({
			id: file.id,
			name: file.name,
			type: file.type,
			folderId: file.folderId || null,
			folderPath: buildFolderPath(foldersById, file.folderId || null),
			uploadedAt: file.uploadedAt,
		}));

	return { files };
});
