import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import {
	canDeleteGlobalFolder,
	collectGlobalFolderTree,
	getGlobalFolderDeletionError,
} from "../../utils/globalDocuments";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const body = await readBody(event);
	const { folderId, dryRun = false } = body;

	if (!folderId) {
		throw createError({ statusCode: 400, message: "Folder ID is required" });
	}

	const rootFolderDoc = await db.collection("globalFolders").doc(folderId).get();
	if (!rootFolderDoc.exists) {
		throw createError({ statusCode: 404, message: "Folder not found" });
	}

	if (!canDeleteGlobalFolder(claims, rootFolderDoc.data())) {
		throw createError({ statusCode: 403, message: "You can only delete your own folders" });
	}

	const folderIds = await collectGlobalFolderTree(folderId);
	const ownedFolderIds = new Set<string>([folderId]);
	const descendantFolderRecords = [];
	const activeFileDocs = [];

	for (const currentFolderId of folderIds) {
		if (currentFolderId !== folderId) {
			const folderDoc = await db.collection("globalFolders").doc(currentFolderId).get();
			if (!folderDoc.exists) {
				continue;
			}
			descendantFolderRecords.push(folderDoc.data());
			ownedFolderIds.add(currentFolderId);
		}

		const filesSnapshot = await db.collection("globalFiles").where("folderId", "==", currentFolderId).get();
		for (const fileDoc of filesSnapshot.docs) {
			if (!fileDoc.data().deletedAt) {
				activeFileDocs.push(fileDoc);
			}
		}
	}

	const deletionError = getGlobalFolderDeletionError({
		claims,
		rootFolder: rootFolderDoc.data(),
		descendantFolders: descendantFolderRecords,
		activeFiles: activeFileDocs.map(fileDoc => fileDoc.data()),
	});

	if (deletionError) {
		throw createError({ statusCode: 403, message: deletionError });
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
		if (ownedFolderIds.has(currentFolderId)) {
			await db.collection("globalFolders").doc(currentFolderId).delete();
		}
	}

	return {
		success: true,
		fileCount: activeFileDocs.length,
		folderCount: Math.max(folderIds.length - 1, 0),
	};
});
