import { auth } from "../../useFirebaseAdmin";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";

export default defineEventHandler(async (event) => {
	try {
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];
		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const decodedToken = await auth.verifyIdToken(idToken);
		const uid = decodedToken.uid;

		const body = await readBody(event);
		const { file } = body;

		if (!file) {
			throw createError({ statusCode: 400, message: "No file provided" });
		}

		// Handle data URL
		const base64Data = file.split(",")[1];
		if (!base64Data) {
			throw createError({ statusCode: 400, message: "Invalid file format" });
		}
		
		const buffer = Buffer.from(base64Data, "base64");

		// Process image with sharp
		// Resize to 512x512 square, optimized jpeg
		const processedImage = await sharp(buffer)
			.resize(512, 512, {
				fit: "cover",
				position: "center"
			})
			.jpeg({ quality: 85 })
			.toBuffer();

		const { storage } = await import("../../useFirebaseAdmin");
		const bucket = storage.bucket();
		const fileName = `profile-pictures/${uid}/${Date.now()}.jpg`;
		const fileUpload = bucket.file(fileName);

		await fileUpload.save(processedImage, {
			contentType: "image/jpeg",
			metadata: {
				cacheControl: "public, max-age=31536000",
			}
		});

		try {
			await fileUpload.makePublic();
		} catch (e: any) {
			console.warn("[Profile Upload] Could not make public:", e.message);
		}

		const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;

		// Update Firebase Auth profile
		await auth.updateUser(uid, {
			photoURL: publicUrl
		});

		return { success: true, photoURL: publicUrl };
	} catch (error: any) {
		console.error("[Profile Upload API Error]:", error);
		throw createError({
			statusCode: error.statusCode || 500,
			message: error.message || "Failed to upload profile picture"
		});
	}
});
