import { db } from "../../../../useFirebaseAdmin";
import { getHomeById } from "../../../../utils/homes";
import { canManageHomeFiles } from "../../../../utils/fileAccess";
import { getUserClaims } from "../../../../utils/auth";
import { buildDocumentProcessingId } from "../../../../utils/documentProcessing";
import { buildDocumentSearchFields } from "../../../../utils/documentSearch";
import { renameHomeFileInHome, sanitizeHomeFileName } from "../../../../utils/homeFiles";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");
	const body = await readBody(event);

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	if (!body.fileId) {
		throw createError({ statusCode: 400, message: "File ID is required" });
	}

	const name = sanitizeHomeFileName(body.name);
	if (!name) {
		throw createError({ statusCode: 400, message: "A valid file name is required" });
	}

	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const home = await getHomeById(homeId);
	if (!canManageHomeFiles(claims, home)) {
		throw createError({
			statusCode: 403,
			message: "Forbidden: You cannot rename files in this home",
		});
	}
	if (!home) {
		throw createError({ statusCode: 404, message: "Home not found" });
	}

	const result = renameHomeFileInHome({ home, fileId: body.fileId, name });

	// The stored file name feeds the search index, so refresh the derived fields
	// alongside the rename.
	const processingRef = db.collection("documentProcessing").doc(
		buildDocumentProcessingId("owner", body.fileId, homeId),
	);
	const processingDoc = await processingRef.get();

	const updates: Promise<unknown>[] = [
		db.collection("homes").doc(homeId).update({
			[result.key]: result.files,
			updatedAt: new Date().toISOString(),
		}),
	];

	if (processingDoc.exists) {
		const existing = processingDoc.data() as Record<string, unknown>;
		const nextFields = buildDocumentSearchFields({
			name,
			type: typeof existing.type === "string" ? existing.type : result.renamedFile.type,
			searchText: typeof existing.searchText === "string" ? existing.searchText : "",
			searchSummary: typeof existing.searchSummary === "string" ? existing.searchSummary : name,
			searchKeywords: Array.isArray(existing.searchKeywords) ? existing.searchKeywords as string[] : [],
		});

		updates.push(processingRef.set({
			name,
			searchSummary: nextFields.searchSummary,
			searchKeywords: nextFields.searchKeywords,
			searchUpdatedAt: nextFields.searchUpdatedAt,
		}, { merge: true }));
	}

	await Promise.all(updates);

	return {
		success: true,
		file: result.renamedFile,
	};
});
