import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import { canAdminGlobalDocuments } from "../../utils/fileAccess";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);
		const claims = await getUserClaims(event);

		if (!claims) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		if (!canAdminGlobalDocuments(claims)) {
			throw createError({ statusCode: 403, message: "Forbidden: Admin only" });
		}

		const { folderId, newName } = body;

		if (!folderId || !newName || typeof newName !== "string") {
			throw createError({ statusCode: 400, message: "folderId and newName are required" });
		}

		const trimmedName = newName.trim();
		if (!trimmedName) {
			throw createError({ statusCode: 400, message: "Folder name cannot be empty" });
		}

		const folderRef = db.collection("globalFolders").doc(folderId);
		const folderDoc = await folderRef.get();

		if (!folderDoc.exists) {
			throw createError({ statusCode: 404, message: "Folder not found" });
		}

		await folderRef.update({
			name: trimmedName,
			updatedAt: new Date().toISOString(),
		});

		return { success: true, id: folderId, name: trimmedName };
	} catch (e: unknown) {
		throw createError({
			statusCode: (e as any).statusCode || 500,
			message: (e as any).message || "Internal Server Error"
		});
	}
});
