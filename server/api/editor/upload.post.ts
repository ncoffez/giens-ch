import { auth } from "../../useFirebaseAdmin";
import { getStorage } from "firebase-admin/storage";
import crypto from "crypto";

export default defineEventHandler(async (event) => {
	try {
		console.log("[Editor Upload] Start request");
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];
		if (!idToken) {
			console.error("[Editor Upload] No token");
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		await auth.verifyIdToken(idToken);
		console.log("[Editor Upload] Token verified");
		
		const body = await readBody(event);
		if (!body) {
			console.error("[Editor Upload] Empty body");
			throw createError({ statusCode: 400, message: "Empty body" });
		}
		
		const { filename, file, type } = body;
		console.log(`[Editor Upload] Received file: ${filename}, type: ${type}, size: ${file?.length || 0}`);

		if (!file || !filename) {
			console.error("[Editor Upload] Missing file or filename");
			throw createError({ statusCode: 400, message: "Missing file or filename" });
		}

		// Handle data URL or raw base64
		let base64Data: string = file;
		if (file.includes(",")) {
			const parts = file.split(",");
			base64Data = parts[1] || parts[0] || "";
		}
		
		if (!base64Data) {
			console.error("[Editor Upload] No base64 data found");
			throw createError({ statusCode: 400, message: "Invalid file data" });
		}
		
		const buffer = Buffer.from(base64Data, "base64");
		console.log(`[Editor Upload] Buffer created, size: ${buffer.length} bytes`);

		// 20MB limit
		if (buffer.length > 20 * 1024 * 1024) {
			throw createError({ statusCode: 413, message: "File too large (max 20MB)" });
		}

		const storage = getStorage();
		const bucket = storage.bucket();
		console.log(`[Editor Upload] Using bucket: ${bucket.name}`);
		
		// Create a unique filename
		const hash = crypto.randomBytes(4).toString("hex");
		const sanitizedFilename = filename.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
		const storagePath = `editor-uploads/${Date.now()}_${hash}_${sanitizedFilename}`;
		
		const fileRef = bucket.file(storagePath);
		
		console.log(`[Editor Upload] Saving to path: ${storagePath}`);
		try {
			await fileRef.save(buffer, {
				contentType: type,
				metadata: {
					cacheControl: "public, max-age=31536000",
				}
			});
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Unknown error";
			console.error("[Editor Upload] Save failed:", message);
			throw createError({ statusCode: 503, message: `Speichern fehlgeschlagen: ${message}` });
		}

		// Try to make public, but don't fail if it's already handled by bucket policies
		try {
			await fileRef.makePublic();
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Unknown error";
			console.warn("[Editor Upload] Could not make public (this is often okay if bucket-level access is enabled):", message);
		}

		// Map type to icon
		let icon = "i-lucide-file";
		if (type.startsWith("image/")) icon = "i-lucide-image";
		else if (type.includes("pdf")) icon = "i-lucide-file-text";
		else if (type.includes("word") || type.includes("officedocument.wordprocessingml")) icon = "i-lucide-file-text";
		else if (type.includes("sheet") || type.includes("excel")) icon = "i-lucide-file-spreadsheet";

		// Construct public URL - use the firebasestorage.googleapis.com format which works with public access
		const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

		return {
			url: publicUrl,
			filename: sanitizedFilename,
			icon,
			type
		};
	} catch (error: unknown) {
		console.error("[Editor Upload API Error]:", error);
		const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
		const message = error instanceof Error ? error.message : "Upload failed";
		throw createError({
			statusCode,
			message
		});
	}
});
