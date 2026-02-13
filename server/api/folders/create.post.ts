import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!claims.admin) {
		throw createError({ statusCode: 403, message: "Only admins can create folders" });
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
		createdBy: claims.uid,
	};

	await db.collection("globalFolders").doc(folderId).set(folder);

	return folder;
});
