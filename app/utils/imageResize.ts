/** Long edge for photos after downscaling (issue #39). */
export const MAX_PHOTO_EDGE = 2560;
export const PHOTO_QUALITY = 0.85;

/** Below this size an image that already fits is left untouched. */
const SMALL_IMAGE_BYTES = 1.5 * 1024 * 1024;

const RESIZABLE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export function shouldResizeImage(file: { type: string }): boolean {
	// GIF would lose its animation, SVG is vector, HEIC/HEIF cannot be decoded
	// by most browsers: those go up unchanged.
	return RESIZABLE_TYPES.has((file.type || "").toLowerCase());
}

export function getResizedDimensions(width: number, height: number, maxEdge = MAX_PHOTO_EDGE) {
	const longEdge = Math.max(width, height);
	if (!longEdge || longEdge <= maxEdge) {
		return { width, height };
	}

	const scale = maxEdge / longEdge;
	return {
		width: Math.round(width * scale),
		height: Math.round(height * scale),
	};
}

interface Canvas2D {
	drawImage(image: unknown, dx: number, dy: number, dw: number, dh: number): void;
	imageSmoothingQuality?: string;
}

const outputType = (type: string) => (type === "image/jpg" ? "image/jpeg" : type);

const renderToBlob = async (bitmap: ImageBitmap, width: number, height: number, type: string, quality: number) => {
	if (typeof OffscreenCanvas !== "undefined") {
		const canvas = new OffscreenCanvas(width, height);
		const context = canvas.getContext("2d") as unknown as Canvas2D | null;
		if (!context) throw new Error("No 2D context");
		context.imageSmoothingQuality = "high";
		context.drawImage(bitmap, 0, 0, width, height);
		return await canvas.convertToBlob({ type, quality });
	}

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");
	if (!context) throw new Error("No 2D context");
	context.imageSmoothingQuality = "high";
	context.drawImage(bitmap, 0, 0, width, height);
	return await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), type, quality);
	});
};

/**
 * Downscales a photo in the browser before it is uploaded, so a 6000 px phone
 * photo travels as ~0.5 MB instead of ~8 MB. Anything that cannot or should not
 * be re-encoded comes back unchanged, and so does any image whose result would
 * not be smaller. Never throws.
 */
export async function resizeImageForUpload(
	file: File,
	options: { maxEdge?: number; quality?: number } = {},
): Promise<File> {
	if (!shouldResizeImage(file) || typeof createImageBitmap !== "function") {
		return file;
	}

	const maxEdge = options.maxEdge || MAX_PHOTO_EDGE;
	const quality = options.quality || PHOTO_QUALITY;
	let bitmap: ImageBitmap | null = null;

	try {
		bitmap = await createImageBitmap(file);
		const target = getResizedDimensions(bitmap.width, bitmap.height, maxEdge);
		const needsScaling = target.width !== bitmap.width || target.height !== bitmap.height;

		if (!needsScaling && file.size <= SMALL_IMAGE_BYTES) {
			return file;
		}
		if (!needsScaling && file.type === "image/png") {
			// Re-encoding a PNG that already fits gains nothing.
			return file;
		}

		const type = outputType(file.type);
		const blob = await renderToBlob(bitmap, target.width, target.height, type, quality);
		if (!blob || blob.size >= file.size) {
			return file;
		}

		return new File([blob], file.name, { type: blob.type || type, lastModified: file.lastModified });
	} catch {
		return file;
	} finally {
		bitmap?.close?.();
	}
}
