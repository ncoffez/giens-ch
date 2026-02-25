import { db, storage } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";
import sharp from "sharp";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const ALLOWED_VIDEO_TYPES = ["video/mp4"];

const processImage = async (buffer: Buffer): Promise<{ thumbnail: Buffer; optimized: Buffer }> => {
	const image = sharp(buffer);
	const metadata = await image.metadata();

	const thumbnail = await sharp(buffer)
		.resize(400, 400, { 
			withoutEnlargement: true, 
			fit: "inside",
			kernel: "lanczos3"
		})
		.webp({ quality: 80 })
		.toBuffer();

	let optimizedImage = sharp(buffer);
	const maxDimension = 1920;
	
	if (metadata.width && metadata.width > maxDimension) {
		optimizedImage = optimizedImage.resize(maxDimension, null, {
			withoutEnlargement: true,
			fit: "inside",
			kernel: "lanczos3"
		});
	}

	const optimized = await optimizedImage
		.webp({ quality: 85, effort: 4 })
		.toBuffer();

	return { thumbnail, optimized };
};

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!claims.admin) {
		throw createError({ statusCode: 403, message: "Only admins can upload files" });
	}

	const body = await readBody(event);
	const { file: base64Data, name, type, size, folderId, lastModified } = body;

	if (!base64Data || !name) {
		throw createError({ statusCode: 400, message: "File data and name are required" });
	}

	const isVideo = ALLOWED_VIDEO_TYPES.includes(type);
	const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
	
	if (size && size > maxSize) {
		throw createError({ 
			statusCode: 400, 
			message: `File too large. Maximum ${isVideo ? '100MB' : '50MB'} allowed.` 
		});
	}

	const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
	if (!matches) {
		throw createError({ statusCode: 400, message: "Invalid file data format" });
	}

	const mimeType = matches[1];
	const base64Content = matches[2];
	const buffer = Buffer.from(base64Content, "base64");

	const fileId = crypto.randomUUID();
	const timestamp = Date.now();
	const sanitized = name.replace(/[^a-zA-Z0-9.-]/g, "_");
	const storagePath = `global-files/${timestamp}-${sanitized}`;

	const bucket = storage.bucket();
	const file = bucket.file(storagePath);

	await file.save(buffer, {
		metadata: {
			contentType: mimeType,
			metadata: {
				uploadedBy: claims.uid,
			},
		},
	});

	let thumbnailPath: string | undefined;
	let optimizedPath: string | undefined;

	if (mimeType.startsWith("image/")) {
		try {
			const { thumbnail, optimized } = await processImage(buffer);

			thumbnailPath = `${storagePath}-thumb`;
			optimizedPath = `${storagePath}-opt`;

			await Promise.all([
				bucket.file(thumbnailPath).save(thumbnail, {
					metadata: { contentType: "image/webp" }
				}),
				bucket.file(optimizedPath).save(optimized, {
					metadata: { contentType: "image/webp" }
				})
			]);
		} catch (e) {
			console.error("Image processing failed, storing original only:", e);
		}
	}

	const fileRecord: Record<string, unknown> = {
		id: fileId,
		name,
		type: mimeType,
		size: size || buffer.length,
		storagePath,
		folderId: folderId || null,
		uploadedAt: new Date().toISOString(),
		uploadedBy: claims.uid,
		lastModified: typeof lastModified === "number" ? lastModified : undefined,
	};

	if (thumbnailPath) fileRecord.thumbnailPath = thumbnailPath;
	if (optimizedPath) fileRecord.optimizedPath = optimizedPath;

	await db.collection("globalFiles").doc(fileId).set(fileRecord);

	return fileRecord;
});
