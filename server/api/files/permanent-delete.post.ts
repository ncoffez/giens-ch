import { db, storage } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!claims.admin) {
		throw createError({ statusCode: 403, message: "Only admins can permanently delete files" });
	}

	const body = await readBody(event);
	const { fileId } = body;

	if (!fileId) {
		throw createError({ statusCode: 400, message: "File ID is required" });
	}

	const fileRef = db.collection("globalFiles").doc(fileId);
	const fileDoc = await fileRef.get();

	if (!fileDoc.exists) {
		throw createError({ statusCode: 404, message: "File not found" });
	}

	const fileData = fileDoc.data()!;

	if (!fileData.deletedAt) {
		throw createError({ statusCode: 400, message: "File must be in trash before permanent deletion" });
	}

	if (fileData.storagePath) {
		try {
			const bucket = storage.bucket();
			const file = bucket.file(fileData.storagePath);
			await file.delete();
		} catch (e: unknown) {
			console.error("Error deleting file from storage:", e);
		}
	}

	await fileRef.delete();

	return { success: true };
});
