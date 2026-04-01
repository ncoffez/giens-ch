import { db } from "../../../../useFirebaseAdmin";
import { isHomeOwner, getHomeById } from "../../../../utils/homes";
import { getUserClaims } from "../../../../utils/auth";
import { buildDocumentProcessingId } from "../../../../utils/documentProcessing";
import { moveHomeFileBetweenVisibilities } from "../../../../utils/homeFiles";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");
	const body = await readBody(event);

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	if (!body.fileId) {
		throw createError({ statusCode: 400, message: "File ID is required" });
	}

	const targetVisibility = body.targetVisibility === "private" ? "private" : body.targetVisibility === "shared" ? "shared" : null;
	if (!targetVisibility) {
		throw createError({ statusCode: 400, message: "Target visibility must be shared or private" });
	}

	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const isOwner = await isHomeOwner(homeId, claims.uid);
	if (!isOwner) {
		throw createError({
			statusCode: 403,
			message: "Forbidden: You cannot move files in this home",
		});
	}

	const home = await getHomeById(homeId);
	if (!home) {
		throw createError({ statusCode: 404, message: "Home not found" });
	}

	const file = [...(home.files || []), ...(home.privateFiles || [])].find((entry) => entry.id === body.fileId);
	if (!file) {
		throw createError({ statusCode: 404, message: "File not found" });
	}

	const sourceVisibility = file.visibility === "private" ? "private" : "shared";
	if (sourceVisibility === targetVisibility) {
		return { success: true, file };
	}

	const result = moveHomeFileBetweenVisibilities({
		home,
		fileId: body.fileId,
		sourceVisibility,
		targetVisibility,
	});

	const processingRef = db.collection("documentProcessing").doc(buildDocumentProcessingId("owner", body.fileId, homeId));
	const processingDoc = await processingRef.get();

	const updates: Promise<unknown>[] = [
		db.collection("homes").doc(homeId).update({
			[result.sourceKey]: result.sourceFiles,
			[result.targetKey]: result.targetFiles,
			updatedAt: new Date().toISOString(),
		}),
	];

	if (processingDoc.exists) {
		updates.push(processingRef.set({
			visibility: targetVisibility,
		}, { merge: true }));
	}

	await Promise.all(updates);

	return {
		success: true,
		file: result.movedFile,
	};
});
