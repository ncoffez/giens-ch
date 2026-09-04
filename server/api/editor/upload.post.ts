import { storage } from "../../useFirebaseAdmin";
import crypto from "crypto";
import { createTokenizedDownloadUrl } from "../../utils/storage";
import { requireSignedIn } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	try {
		await requireSignedIn(event);

		const body = await readBody(event);
		if (!body) {
			throw createError({ statusCode: 400, message: "Empty body" });
		}
		
		const { filename, file, type } = body;

		if (!file || !filename) {
			throw createError({ statusCode: 400, message: "Missing file or filename" });
		}

		// Handle data URL or raw base64
		let base64Data: string = file;
		if (file.includes(",")) {
			const parts = file.split(",");
			base64Data = parts[1] || parts[0] || "";
		}
		
		if (!base64Data) {
			throw createError({ statusCode: 400, message: "Invalid file data" });
		}
		
		const buffer = Buffer.from(base64Data, "base64");

		// 20MB limit
		if (buffer.length > 20 * 1024 * 1024) {
			throw createError({ statusCode: 413, message: "File too large (max 20MB)" });
		}

		const bucket = storage.bucket();
		
		// Create a unique filename
		const hash = crypto.randomBytes(4).toString("hex");
		const sanitizedFilename = filename.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
		const storagePath = `editor-uploads/${Date.now()}_${hash}_${sanitizedFilename}`;
		
		const fileRef = bucket.file(storagePath);
		
		try {
			await fileRef.save(buffer, {
				contentType: type,
				metadata: {
					cacheControl: "public, max-age=31536000",
				},
			});
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Unknown error";
			throw createError({ statusCode: 503, message: `Speichern fehlgeschlagen: ${message}` });
		}

		// Map type to icon
		let icon = "i-lucide-file";
		if (type.startsWith("image/")) icon = "i-lucide-image";
		else if (type.includes("pdf")) icon = "i-lucide-file-text";
		else if (type.includes("word") || type.includes("officedocument.wordprocessingml")) icon = "i-lucide-file-text";
		else if (type.includes("sheet") || type.includes("excel")) icon = "i-lucide-file-spreadsheet";

		const publicUrl = await createTokenizedDownloadUrl(bucket, storagePath);

		return {
			url: publicUrl,
			filename: sanitizedFilename,
			icon,
			type
		};
	} catch (error: unknown) {
		const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
		const message = error instanceof Error ? error.message : "Upload failed";
		throw createError({
			statusCode,
			message
		});
	}
});
