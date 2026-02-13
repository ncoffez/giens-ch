import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!claims.admin) {
		throw createError({ statusCode: 403, message: "Only admins can restore files" });
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
		throw createError({ statusCode: 400, message: "File is not in trash" });
	}

	await fileRef.update({
		deletedAt: null,
		deletedBy: null,
	});

	return { success: true };
});
