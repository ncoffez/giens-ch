import { db } from "../../useFirebaseAdmin";
import { requireAreaPermission } from "../../utils/permissionAccess";

export default defineEventHandler(async (event) => {
	await requireAreaPermission(event, "admin.trash.manage");

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
