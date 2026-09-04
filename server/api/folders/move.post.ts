import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import { canAdminGlobalDocuments } from "../../utils/fileAccess";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!canAdminGlobalDocuments(claims)) {
		throw createError({ statusCode: 403, message: "Only admins can move folders" });
	}

	const body = await readBody(event);
	const { folderId, targetParentId } = body;

	if (!folderId) {
		throw createError({ statusCode: 400, message: "folderId is required" });
	}

	if (targetParentId !== null && typeof targetParentId !== "string") {
		throw createError({ statusCode: 400, message: "targetParentId must be a string or null" });
	}

	if (folderId === targetParentId) {
		throw createError({ statusCode: 400, message: "Cannot move folder into itself" });
	}

	const folderRef = db.collection("globalFolders").doc(folderId);
	const folderDoc = await folderRef.get();

	if (!folderDoc.exists) {
		throw createError({ statusCode: 404, message: "Folder not found" });
	}

	if (targetParentId) {
		const targetFolderDoc = await db.collection("globalFolders").doc(targetParentId).get();
		if (!targetFolderDoc.exists) {
			throw createError({ statusCode: 404, message: "Target folder not found" });
		}

		// Check for circular reference - target cannot be a descendant of the folder being moved
		let currentParentId: string | null = targetParentId;
		while (currentParentId) {
			if (currentParentId === folderId) {
				throw createError({ statusCode: 400, message: "Cannot move folder into its own descendant" });
			}
			const parentDoc = await db.collection("globalFolders").doc(currentParentId).get();
			currentParentId = parentDoc.exists ? parentDoc.data()?.parentId : null;
		}
	}

	await folderRef.update({
		parentId: targetParentId,
		updatedAt: new Date().toISOString(),
	});

	return { success: true, id: folderId, parentId: targetParentId };
});
