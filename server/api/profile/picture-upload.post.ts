import { auth } from "../../useFirebaseAdmin";
import sharp from "sharp";
import { requireSignedIn } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	console.log("[Profile Upload] Request received");

	const { uid } = await requireSignedIn(event);

	// 2. Payload Guard
	const rawBody = await readRawBody(event);
	if (!rawBody) throw createError({ statusCode: 400, message: "Anfrage leer." });

	let body: any;
	try {
		body = JSON.parse(rawBody.toString());
	} catch (e: unknown) {
		throw createError({ statusCode: 400, message: "Datei zu groß oder ungültiges Format." });
	}

	if (!body?.file) throw createError({ statusCode: 400, message: "Keine Datei gefunden." });

	// 3. Decoding & Validation
	let base64Data: string = body.file;
	if (base64Data.includes(",")) base64Data = base64Data.split(",")[1] || "";

	const buffer = Buffer.from(base64Data, "base64");
	if (buffer.length < 100) throw createError({ statusCode: 400, message: "Bilddaten beschädigt." });

	// 4. Image Validation & Processing
	let processedImage: Buffer;
	try {
		processedImage = await sharp(buffer)
			.resize(512, 512, { fit: "cover", position: "center" })
			.jpeg({ quality: 85 })
			.toBuffer();
	} catch (e: unknown) {
		throw createError({ statusCode: 422, message: "Bildverarbeitung fehlgeschlagen." });
	}

	// 5. Storage (Sustainable Strategy)
	let publicUrl: string;
	try {
		const { storage, db } = await import("../../useFirebaseAdmin");
		const bucket = storage.bucket();
		
		// FIXED PATH: profile-pictures/UID (as requested)
		const activePath = `profile-pictures/${uid}`;
		// HISTORY: profile-pictures/UID/history/TIMESTAMP.jpg
		const historyPath = `profile-pictures/${uid}/history/${Date.now()}.jpg`;
		
		const activeFile = bucket.file(activePath);
		const historyFile = bucket.file(historyPath);

		console.log(`[Profile Upload] Saving to permanent path: ${activePath}`);
		
		await Promise.all([
			activeFile.save(processedImage, {
				contentType: "image/jpeg",
				metadata: { cacheControl: "public, max-age=3600" }
			}),
			historyFile.save(processedImage, {
				contentType: "image/jpeg",
				metadata: { cacheControl: "public, max-age=31536000" }
			})
		]);

		// Construct Public URL with Cache Busting
		const timestamp = Date.now();
		publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(activePath)}?alt=media&t=${timestamp}`;
		
		// Attempt permissions sync
		activeFile.makePublic().catch(() => {});
		historyFile.makePublic().catch(() => {});
		
		// 6. Persist to Auth & Firestore
		await auth.updateUser(uid, { photoURL: publicUrl });
		await db.collection("users").doc(uid).set({
			photoURL: publicUrl,
			updatedAt: new Date().toISOString()
		}, { merge: true });

		return { success: true, photoURL: publicUrl };
	} catch (e: unknown) {
		throw createError({ statusCode: 503, message: "Speicherdienst Fehler: " + (e instanceof Error ? e.message : 'Unknown error') });
	}
});
