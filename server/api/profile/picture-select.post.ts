import { auth } from "../../useFirebaseAdmin";
import { requireSignedIn } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	try {
		const { uid } = await requireSignedIn(event);

		const body = await readBody(event);
		const { photoURL } = body; // This is the history URL from the gallery

		if (!photoURL) throw createError({ statusCode: 400, message: "No photoURL provided" });

		const { storage, db } = await import("../../useFirebaseAdmin");
		const bucket = storage.bucket();
		
		// Extract file path from URL (between /o/ and ?)
		const urlObj = new URL(photoURL);
		const pathname = urlObj.pathname;
		const pathParts = pathname.split("/o/")[1];
		if (!pathParts) throw new Error("Invalid URL format");
		const sourcePath = decodeURIComponent(pathParts);
		
		// The destination is always the permanent active path
		const activePath = `profile-pictures/${uid}`;
		
		console.log(`[Profile Select] Copying ${sourcePath} to ${activePath}`);
		
		// Copy historical file to active location
		await bucket.file(sourcePath).copy(bucket.file(activePath));
		
		// Construct the fixed URL with fresh cache busting
		const finalUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(activePath)}?alt=media&t=${Date.now()}`;

		// Update both Auth and Firestore
		await Promise.all([
			auth.updateUser(uid, { photoURL: finalUrl }),
			db.collection("users").doc(uid).set({
				photoURL: finalUrl,
				updatedAt: new Date().toISOString()
			}, { merge: true })
		]);

		return { success: true, photoURL: finalUrl };
	} catch (error: unknown) {
		console.error("[Profile Select API Error]:", error);
		throw createError({ statusCode: 500, message: "Fehler beim Auswählen des Bildes." });
	}
});
