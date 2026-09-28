import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import { collectGlobalFolderTree } from "../../utils/globalDocuments";
import { assertDocumentAction } from "../../utils/permissionAccess";
import { removeFolderPermissionOverrides } from "../../utils/permissionConfig";

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

	await assertDocumentAction(claims, folderId, "delete");

	const folderIds = await collectGlobalFolderTree(folderId);
	const ownedFolderIds = new Set<string>([folderId]);
	const activeFileDocs = [];

	for (const currentFolderId of folderIds) {
		if (currentFolderId !== folderId) {
			const folderDoc = await db.collection("globalFolders").doc(currentFolderId).get();
			if (!folderDoc.exists) {
				continue;
			}
			ownedFolderIds.add(currentFolderId);
		}

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
		if (ownedFolderIds.has(currentFolderId)) {
			await db.collection("globalFolders").doc(currentFolderId).delete();
		}
	}

	await removeFolderPermissionOverrides(folderIds);

	return {
		success: true,
		fileCount: activeFileDocs.length,
		folderCount: Math.max(folderIds.length - 1, 0),
	};
});
