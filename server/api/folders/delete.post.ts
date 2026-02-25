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
	const { folderId } = body;

	if (!folderId) {
		throw createError({ statusCode: 400, message: "Folder ID is required" });
	}

	const filesSnapshot = await db.collection("globalFiles").where("folderId", "==", folderId).get();
	const foldersSnapshot = await db.collection("globalFolders").where("parentId", "==", folderId).get();

	const activeFiles = filesSnapshot.docs.filter(doc => !doc.data().deletedAt);

	if (activeFiles.length > 0 || !foldersSnapshot.empty) {
		throw createError({ statusCode: 400, message: "Folder is not empty. Please delete all files and subfolders first." });
	}

	await db.collection("globalFolders").doc(folderId).delete();

	return { success: true };
});
