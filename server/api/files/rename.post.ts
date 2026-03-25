import { db, auth } from "../../useFirebaseAdmin";
import { buildDocumentSearchFields } from "../../utils/documentSearch";
import { buildDocumentProcessingId } from "../../utils/documentProcessing";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];

		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const decodedToken = await auth.verifyIdToken(idToken);

		if (!decodedToken.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Admin only" });
		}

		const { fileId, newName } = body;

		if (!fileId || !newName || typeof newName !== "string") {
			throw createError({ statusCode: 400, message: "fileId and newName are required" });
		}

		const trimmedName = newName.trim();
		if (!trimmedName) {
			throw createError({ statusCode: 400, message: "File name cannot be empty" });
		}

		const fileRef = db.collection("globalFiles").doc(fileId);
		const fileDoc = await fileRef.get();

		if (!fileDoc.exists) {
			throw createError({ statusCode: 404, message: "File not found" });
		}

		const existingData = fileDoc.data() as Record<string, any>;
		const processingRef = db.collection("documentProcessing").doc(buildDocumentProcessingId("global", fileId));
		const processingDoc = await processingRef.get();

		const nextFields = buildDocumentSearchFields({
			name: trimmedName,
			type: existingData.type,
			searchText: typeof existingData.searchText === "string" ? existingData.searchText : "",
			searchSummary: typeof existingData.searchSummary === "string" ? existingData.searchSummary : trimmedName,
			searchKeywords: Array.isArray(existingData.searchKeywords) ? existingData.searchKeywords : [],
		});

		await fileRef.update({
			name: trimmedName,
			updatedAt: new Date().toISOString(),
			...nextFields,
		});

		if (processingDoc.exists) {
			await processingRef.set({
				name: trimmedName,
				searchSummary: nextFields.searchSummary,
				searchKeywords: nextFields.searchKeywords,
				searchUpdatedAt: nextFields.searchUpdatedAt,
			}, { merge: true });
		}

		return { success: true, id: fileId, name: trimmedName };
	} catch (e: unknown) {
		const error = e as { statusCode?: number; message?: string };
		throw createError({
			statusCode: error.statusCode || 500,
			message: error.message || "Internal Server Error"
		});
	}
});
