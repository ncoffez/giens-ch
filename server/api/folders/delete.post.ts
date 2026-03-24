import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!claims.admin) {
		throw createError({ statusCode: 403, message: "Only admins can delete folders" });
	}

	const body = await readBody(event);
	const { folderId, dryRun = false } = body;

	if (!folderId) {
		throw createError({ statusCode: 400, message: "Folder ID is required" });
	}

	const collectFolderIds = async (rootFolderId: string) => {
		const descendants: string[] = [rootFolderId];
		const queue: string[] = [rootFolderId];

		while (queue.length > 0) {
			const currentId = queue.shift();
			if (!currentId) continue;

			const childrenSnapshot = await db.collection("globalFolders").where("parentId", "==", currentId).get();
			for (const childDoc of childrenSnapshot.docs) {
				descendants.push(childDoc.id);
				queue.push(childDoc.id);
			}
		}

		return descendants;
	};

	const folderIds = await collectFolderIds(folderId);
	const activeFileDocs = [];

	for (const currentFolderId of folderIds) {
		const filesSnapshot = await db.collection("globalFiles").where("folderId", "==", currentFolderId).get();
		for (const fileDoc of filesSnapshot.docs) {
			if (!fileDoc.data().deletedAt) {
				activeFileDocs.push(fileDoc);
			}
		}
	}

	if (dryRun) {
		return {
			success: true,
			fileCount: activeFileDocs.length,
			folderCount: Math.max(folderIds.length - 1, 0),
		};
	}

	for (const fileDoc of activeFileDocs) {
		await fileDoc.ref.update({
			deletedAt: new Date().toISOString(),
			deletedBy: claims.uid,
		});
	}

	for (const currentFolderId of [...folderIds].reverse()) {
		await db.collection("globalFolders").doc(currentFolderId).delete();
	}

	return {
		success: true,
		fileCount: activeFileDocs.length,
		folderCount: Math.max(folderIds.length - 1, 0),
	};
});
