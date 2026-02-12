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
	const { folderId, name } = body;

	if (!folderId) {
		throw createError({ statusCode: 400, message: "Folder ID is required" });
	}

	const homeRef = db.collection("homes").doc(homeId);
	const homeDoc = await homeRef.get();
	const homeData = homeDoc.data();
	const folders = homeData?.folders || [];

	const folderIndex = folders.findIndex((f: any) => f.id === folderId);
	if (folderIndex === -1) {
		throw createError({ statusCode: 404, message: "Folder not found" });
	}

	if (name) {
		folders[folderIndex].name = name.trim();
	} else {
		const files = homeData?.files || [];
		const hasFiles = files.some((f: any) => f.folderId === folderId);
		if (hasFiles) {
			throw createError({ statusCode: 400, message: "Cannot delete folder with files. Move or delete files first." });
		}
		folders.splice(folderIndex, 1);
	}

	await homeRef.update({
		folders,
		updatedAt: new Date().toISOString(),
	});

	return { success: true };
});