import { auth } from "../../useFirebaseAdmin";
import sharp from "sharp";

export default defineEventHandler(async (event) => {
	console.log("[Profile Upload] Request received");

	// 1. Auth Guard
	const idToken = event.headers.get("authorization")?.split("Bearer ")[1];
	if (!idToken) {
		console.error("[Profile Upload] No token found in headers");
		throw createError({ statusCode: 401, statusMessage: "Unauthorized", message: "Kein Authentifizierungs-Token gefunden. Bitte melden Sie sich erneut an." });
	}

	let uid: string;
	try {
		const decodedToken = await auth.verifyIdToken(idToken);
		uid = decodedToken.uid;
		console.log(`[Profile Upload] Authenticated UID: ${uid}`);
	} catch (e: any) {
		console.error("[Profile Upload] Auth verification failed:", e.message);
		throw createError({ statusCode: 401, statusMessage: "Unauthorized", message: "Sitzung abgelaufen oder ungültig." });
	}

	// 2. Payload Guard
	const rawBody = await readRawBody(event);
	if (!rawBody) {
		console.error("[Profile Upload] Empty body received");
		throw createError({ statusCode: 400, statusMessage: "Bad Request", message: "Anfrage-Text ist leer." });
	}

	let body: any;
	try {
		body = JSON.parse(rawBody.toString());
	} catch (e: any) {
		console.error("[Profile Upload] JSON parse error:", e.message);
		throw createError({ statusCode: 400, statusMessage: "Bad Request", message: "Ungültiges JSON-Format oder Datei zu groß für den Server." });
	}

	if (!body || !body.file) {
		console.error("[Profile Upload] Missing 'file' field in body");
		throw createError({ statusCode: 400, statusMessage: "Bad Request", message: "Keine Bilddatei in der Anfrage gefunden." });
	}

	// 3. Decoding Guard
	let base64Data: string = body.file || "";
	if (base64Data.includes(",")) {
		base64Data = base64Data.split(",")[1] || "";
	}

	let buffer: Buffer;
	try {
		buffer = Buffer.from(base64Data, "base64");
		console.log(`[Profile Upload] Buffer created: ${buffer.length} bytes`);
		if (buffer.length < 100) {
			throw new Error("Buffer too small to be a valid image");
		}
	} catch (e: any) {
		console.error("[Profile Upload] Base64 decoding failed:", e.message);
		throw createError({ statusCode: 400, statusMessage: "Bad Request", message: "Die Bilddaten konnten nicht verarbeitet werden." });
	}

	// 4. Image Validation (Sharp Metadata)
	try {
		const metadata = await sharp(buffer).metadata();
		console.log(`[Profile Upload] Image metadata: ${metadata.format}, ${metadata.width}x${metadata.height}`);
	} catch (e: any) {
		console.error("[Profile Upload] Sharp metadata check failed:", e.message);
		throw createError({ statusCode: 422, statusMessage: "Unprocessable Entity", message: "Die Datei ist kein gültiges Bild oder beschädigt." });
	}

	// 5. Image Processing (Sharp Resize)
	let processedImage: Buffer;
	try {
		console.log("[Profile Upload] Starting image optimization...");
		processedImage = await sharp(buffer)
			.resize(512, 512, { fit: "cover", position: "center" })
			.jpeg({ quality: 85 })
			.toBuffer();
		console.log(`[Profile Upload] Optimization complete: ${processedImage.length} bytes`);
	} catch (e: any) {
		console.error("[Profile Upload] Sharp processing failed:", e.message);
		throw createError({ statusCode: 422, statusMessage: "Unprocessable Entity", message: "Fehler bei der Bildoptimierung. Das Bild ist möglicherweise zu groß oder in einem nicht unterstützten Format." });
	}

	// 6. Storage Guard
	let publicUrl: string;
	try {
		const { storage, db } = await import("../../useFirebaseAdmin");
		const bucket = storage.bucket();
		const bucketName = bucket.name;
		console.log(`[Profile Upload] Bucket Name: ${bucketName}`);
		
		const fileName = `profile-pictures/${uid}/${Date.now()}.jpg`;
		const fileUpload = bucket.file(fileName);

		console.log(`[Profile Upload] Saving to storage path: ${fileName}`);
		await fileUpload.save(processedImage, {
			contentType: "image/jpeg",
			metadata: { cacheControl: "public, max-age=31536000" }
		});

		// Ensure the URL is correctly constructed. Encode the fileName but NOT the bucket name.
		publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(fileName)}?alt=media`;
		console.log(`[Profile Upload] Generated Public URL: ${publicUrl}`);
		
		// Attempt makePublic but don't fail
		fileUpload.makePublic().catch(e => console.warn("[Profile Upload] makePublic suppressed:", e.message));
		
		// 7. Profile Update Guard
		try {
			// Update Firebase Auth profile
			await auth.updateUser(uid, { photoURL: publicUrl });
			console.log("[Profile Upload] Auth updated successfully");

			// Persist to Firestore
			await db.collection("users").doc(uid).set({
				photoURL: publicUrl,
				updatedAt: new Date().toISOString()
			}, { merge: true });
			console.log(`[Profile Upload] Firestore updated for UID ${uid}`);
		} catch (e: any) {
			console.error("[Profile Upload] Auth or Firestore update failed:", e.message);
			throw createError({ statusCode: 500, statusMessage: "Internal Server Error", message: "Profil konnte nicht aktualisiert werden. Bitte wenden Sie sich an den Support." });
		}
	} catch (e: any) {
		if (e.statusCode) throw e;
		console.error("[Profile Upload] Storage error:", e.message);
		throw createError({ 
			statusCode: 503, 
			statusMessage: "Service Unavailable", 
			message: `Der Speicherdienst ist vorübergehend nicht erreichbar: ${e.message}` 
		});
	}

	return { success: true, photoURL: publicUrl };
});
