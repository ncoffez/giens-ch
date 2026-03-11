import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
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

	if (fileData.deletedAt) {
		throw createError({ statusCode: 400, message: "File is already in trash" });
	}

	if (!claims.admin && fileData.uploadedBy !== claims.uid) {
		throw createError({ statusCode: 403, message: "You can only delete your own files" });
	}

	await fileRef.update({
		deletedAt: new Date().toISOString(),
		deletedBy: claims.uid,
	});

	return { success: true };
});
