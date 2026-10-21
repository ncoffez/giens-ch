import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import { collectGlobalFolderTree } from "../../utils/globalDocuments";
import { deleteForbidden, loadDeleteScope } from "../../utils/documentDeletion";
import { removeFolderPermissionOverrides } from "../../utils/permissionConfig";
import { folderDeletionBlock } from "#shared/sitePermissions";

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

	// "delete" removes the whole tree; "deleteOwn" only a tree this user built (#35).
	const scope = await loadDeleteScope(claims, folderId);
	if (scope === "none") throw deleteForbidden("forbidden");

	const folderIds = await collectGlobalFolderTree(folderId);
	const ownedFolderIds = new Set<string>([folderId]);
	const descendantFolders: Array<{ createdBy?: unknown }> = [];
	const activeFileDocs = [];

	for (const currentFolderId of folderIds) {
		if (currentFolderId !== folderId) {
			const folderDoc = await db.collection("globalFolders").doc(currentFolderId).get();
			if (!folderDoc.exists) {
				continue;
			}
			ownedFolderIds.add(currentFolderId);
			descendantFolders.push(folderDoc.data() || {});
		}

		const filesSnapshot = await db.collection("globalFiles").where("folderId", "==", currentFolderId).get();
		for (const fileDoc of filesSnapshot.docs) {
			if (!fileDoc.data().deletedAt) {
				activeFileDocs.push(fileDoc);
			}
		}
	}

	const blocked = folderDeletionBlock({
		scope,
		claims,
		rootFolder: rootFolderDoc.data(),
		descendantFolders,
		activeFiles: activeFileDocs.map((fileDoc) => fileDoc.data()),
	});
	if (blocked) throw deleteForbidden(blocked);

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
