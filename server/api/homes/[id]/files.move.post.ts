import { db } from "../../../useFirebaseAdmin";
import { getUserClaims } from "../../../utils/auth";
import { canEditHome } from "../../../utils/homes";

export default defineEventHandler(async (event) => {
	const authHeader = getHeader(event, "Authorization");
	if (!authHeader) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const homeId = getRouterParam(event, "id");
	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID required" });
	}

	const canEdit = await canEditHome(homeId, claims.uid, !!claims.admin);
	if (!canEdit) {
		throw createError({ statusCode: 403, message: "Not authorized to edit this home" });
	}

	const body = await readBody(event);
	const { fileId, targetFolderId } = body;

	if (!fileId) {
		throw createError({ statusCode: 400, message: "fileId is required" });
	}

	if (targetFolderId !== null && typeof targetFolderId !== "string") {
		throw createError({ statusCode: 400, message: "targetFolderId must be a string or null" });
	}

	const homeRef = db.collection("homes").doc(homeId);
	const homeDoc = await homeRef.get();
	const homeData = homeDoc.data();
	const files = homeData?.files || [];
	const folders = homeData?.folders || [];

	const fileIndex = files.findIndex((f: any) => f.id === fileId);
	if (fileIndex === -1) {
		throw createError({ statusCode: 404, message: "File not found" });
	}

	if (targetFolderId) {
		const folderExists = folders.some((f: any) => f.id === targetFolderId);
		if (!folderExists) {
			throw createError({ statusCode: 404, message: "Target folder not found" });
		}
	}

	files[fileIndex].folderId = targetFolderId;
	files[fileIndex].updatedAt = new Date().toISOString();

	await homeRef.update({
		files,
		updatedAt: new Date().toISOString(),
	});

	return { success: true, id: fileId, folderId: targetFolderId };
});
