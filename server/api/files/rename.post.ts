import { db, auth } from "../../useFirebaseAdmin";

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

		await fileRef.update({
			name: trimmedName,
			updatedAt: new Date().toISOString(),
		});

		return { success: true, id: fileId, name: trimmedName };
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error"
		});
	}
});
