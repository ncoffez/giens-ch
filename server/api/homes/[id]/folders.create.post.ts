import { db, storage } from "../../../useFirebaseAdmin";
import { getUserClaims } from "../../../utils/auth";
import { canEditHome } from "../../../utils/homes";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

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
	const { name, parentId } = body;

	if (!name || typeof name !== "string" || name.trim().length === 0) {
		throw createError({ statusCode: 400, message: "Folder name is required" });
	}

	const folderId = crypto.randomUUID();
	const now = new Date().toISOString();

	const folder = {
		id: folderId,
		name: name.trim(),
		parentId: parentId || null,
		createdAt: now,
	};

	const homeRef = db.collection("homes").doc(homeId);
	const homeDoc = await homeRef.get();
	const homeData = homeDoc.data();
	const folders = homeData?.folders || [];

	await homeRef.update({
		folders: [...folders, folder],
		updatedAt: now,
	});

	return folder;
});