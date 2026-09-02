export type FilePreviewKind = "image" | "video" | "audio" | "pdf" | "text" | "unsupported";

/** How a file can be rendered inline, if at all. */
export function getFilePreviewKind(type: string | undefined): FilePreviewKind {
	const value = type || "";

	if (value.startsWith("image/")) return "image";
	if (value.startsWith("video/")) return "video";
	if (value.startsWith("audio/")) return "audio";
	if (value === "application/pdf") return "pdf";
	if (value.startsWith("text/")) return "text";

	return "unsupported";
}

/** True when the browser can show the file without downloading it first. */
export function canPreviewFile(type: string | undefined): boolean {
	return getFilePreviewKind(type) !== "unsupported";
}

export const FILE_NAME_DISPLAY_LIMIT = 30;

/**
 * Shortens long file names for display while keeping the extension readable.
 * The full name is expected to stay available through a title/aria-label so it
 * can still be revealed on hover.
 */
export function truncateFileName(name: string | undefined, limit: number = FILE_NAME_DISPLAY_LIMIT): string {
	const value = (name || "").trim();
	if (!value || value.length <= limit) return value;

	const lastDot = value.lastIndexOf(".");
	const hasUsableExtension = lastDot > 0 && lastDot > value.length - 12 && lastDot < value.length - 1;
	const extension = hasUsableExtension ? value.slice(lastDot) : "";
	const base = hasUsableExtension ? value.slice(0, lastDot) : value;

	// Reserve room for the ellipsis and the extension, then keep the head and
	// the tail of the base name so similar names stay distinguishable.
	const available = Math.max(limit - extension.length - 1, 4);
	const headLength = Math.ceil(available / 2);
	const tailLength = Math.floor(available / 2);

	if (base.length <= available) return `${base}${extension}`;

	return `${base.slice(0, headLength)}…${base.slice(base.length - tailLength)}${extension}`;
}

export function getFileTypeName(type: string | undefined): string {
	if (!type) return "Unbekannt";
	
	// Images
	if (type.startsWith("image/")) return "Bild";
	
	// Videos
	if (type.startsWith("video/")) return "Video";
	
	// Audio
	if (type.startsWith("audio/")) return "Audio";
	
	// Documents
	if (type === "application/pdf") return "PDF";
	if (type.includes("word") || type.includes("wordprocessingml")) return "Word";
	if (type.includes("excel") || type.includes("spreadsheetml")) return "Excel";
	if (type.includes("powerpoint") || type.includes("presentationml")) return "PowerPoint";
	
	// Archives
	if (type.includes("zip") || type.includes("rar") || type.includes("archive") || type.includes("compressed")) return "Archiv";
	
	// Code
	if (type.includes("json") || type.includes("javascript") || type.includes("typescript") || type.includes("html") || type.includes("css")) return "Code";
	
	// Text
	if (type.startsWith("text/")) return "Text";
	
	return "Datei";
}

export function getFileIcon(type: string | undefined): string {
	if (!type) return "i-lucide-file";
	
	if (type.startsWith("image/")) return "i-lucide-image";
	if (type === "application/pdf") return "i-lucide-file-text";
	if (type.includes("word") || type.includes("document")) return "i-lucide-file-text";
	if (type.includes("sheet") || type.includes("excel")) return "i-lucide-spreadsheet";
	if (type.includes("presentation") || type.includes("powerpoint")) return "i-lucide-presentation";
	if (type.includes("zip") || type.includes("rar") || type.includes("archive") || type.includes("compressed")) return "i-lucide-archive";
	if (type.startsWith("video/")) return "i-lucide-video";
	if (type.startsWith("audio/")) return "i-lucide-music";
	if (type.includes("json") || type.includes("javascript") || type.includes("typescript") || type.includes("html") || type.includes("css")) return "i-lucide-code";
	
	return "i-lucide-file";
}

export function getFileIconColor(type: string | undefined): string {
	if (!type) return "text-stone-400";
	
	if (type.startsWith("image/")) return "text-purple-500";
	if (type === "application/pdf") return "text-red-500";
	if (type.includes("word") || type.includes("document")) return "text-blue-500";
	if (type.includes("sheet") || type.includes("excel")) return "text-green-500";
	if (type.includes("presentation") || type.includes("powerpoint")) return "text-orange-500";
	if (type.includes("zip") || type.includes("rar") || type.includes("archive")) return "text-yellow-600";
	if (type.startsWith("video/")) return "text-pink-500";
	if (type.startsWith("audio/")) return "text-cyan-500";
	if (type.includes("json") || type.includes("javascript") || type.includes("typescript")) return "text-emerald-500";
	
	return "text-stone-400";
}

export function getFileIconBg(type: string | undefined): string {
	if (!type) return "bg-stone-100 dark:bg-stone-800";
	
	if (type.startsWith("image/")) return "bg-purple-100 dark:bg-purple-900/30";
	if (type === "application/pdf") return "bg-red-100 dark:bg-red-900/30";
	if (type.includes("word") || type.includes("document")) return "bg-blue-100 dark:bg-blue-900/30";
	if (type.includes("sheet") || type.includes("excel")) return "bg-green-100 dark:bg-green-900/30";
	if (type.includes("presentation") || type.includes("powerpoint")) return "bg-orange-100 dark:bg-orange-900/30";
	if (type.includes("zip") || type.includes("rar") || type.includes("archive")) return "bg-yellow-100 dark:bg-yellow-900/30";
	if (type.startsWith("video/")) return "bg-pink-100 dark:bg-pink-900/30";
	if (type.startsWith("audio/")) return "bg-cyan-100 dark:bg-cyan-900/30";
	if (type.includes("json") || type.includes("javascript") || type.includes("typescript")) return "bg-emerald-100 dark:bg-emerald-900/30";
	
	return "bg-stone-100 dark:bg-stone-800";
}
