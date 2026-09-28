import { db, storage } from "../../../../useFirebaseAdmin";
import { assertHomeSection } from "../../../../utils/permissionAccess";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");
	const body = await readBody(event);

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	if (!body.fileId) {
		throw createError({ statusCode: 400, message: "File ID is required" });
	}

	const { home } = await assertHomeSection(event, homeId, "home.files.upload");

	const isPrivate = !!body.private;
	const sourceFiles = isPrivate ? (home.privateFiles || []) : (home.files || []);
	const file = sourceFiles.find((f) => f.id === body.fileId);
	if (!file) {
		throw createError({ statusCode: 404, message: "File not found" });
	}

	const targetCollectionKey = isPrivate ? "privateFiles" : "files";
	const files = sourceFiles.filter((f) => f.id !== body.fileId);

	await db.collection("homes").doc(homeId).update({
		[targetCollectionKey]: files,
		updatedAt: new Date().toISOString(),
	});

	// Delete from storage
	if (file.storagePath) {
		try {
			const bucket = storage.bucket();
			await bucket.file(file.storagePath).delete();
		} catch (e) {
			console.error("Error deleting file from storage:", e);
		}
	}

	return { success: true };
});
