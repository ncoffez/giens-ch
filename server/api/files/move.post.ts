import { db, auth } from "../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];

		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const decodedToken = await auth.verifyIdToken(idToken);

		if (!decodedToken.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Admin only" });
		}

		const { fileId, targetFolderId } = body;

		if (!fileId) {
			throw createError({ statusCode: 400, message: "fileId is required" });
		}

		if (targetFolderId !== null && typeof targetFolderId !== "string") {
			throw createError({ statusCode: 400, message: "targetFolderId must be a string or null" });
		}

		const fileRef = db.collection("globalFiles").doc(fileId);
		const fileDoc = await fileRef.get();

		if (!fileDoc.exists) {
			throw createError({ statusCode: 404, message: "File not found" });
		}

		if (targetFolderId) {
			const folderDoc = await db.collection("globalFolders").doc(targetFolderId).get();
			if (!folderDoc.exists) {
				throw createError({ statusCode: 404, message: "Target folder not found" });
			}
		}

		await fileRef.update({
			folderId: targetFolderId,
			updatedAt: new Date().toISOString(),
		});

		return { success: true, id: fileId, folderId: targetFolderId };
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error"
		});
	}
});
