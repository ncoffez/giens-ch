import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import { deleteForbidden, loadDeleteScope } from "../../utils/documentDeletion";
import { canDeleteDocumentItem } from "#shared/sitePermissions";

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

	// "delete" removes any file; "deleteOwn" only files this user uploaded (#35).
	const scope = await loadDeleteScope(claims, fileData.folderId || null);
	if (scope === "none") throw deleteForbidden("forbidden");
	if (!canDeleteDocumentItem(scope, claims, fileData.uploadedBy)) throw deleteForbidden("not-own");

	await fileRef.update({
		deletedAt: new Date().toISOString(),
		deletedBy: claims.uid,
	});

	return { success: true };
});
