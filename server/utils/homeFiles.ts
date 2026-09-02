import type { Home, HomeFile } from "../../types";

interface MoveHomeFileInput {
	home: Home;
	fileId: string;
	sourceVisibility: "shared" | "private";
	targetVisibility: "shared" | "private";
}

export function moveHomeFileBetweenVisibilities({
	home,
	fileId,
	sourceVisibility,
	targetVisibility,
}: MoveHomeFileInput) {
	const sourceKey = sourceVisibility === "private" ? "privateFiles" : "files";
	const targetKey = targetVisibility === "private" ? "privateFiles" : "files";

	const sourceFiles = [...(sourceVisibility === "private" ? home.privateFiles || [] : home.files || [])];
	const targetFiles = [...(targetVisibility === "private" ? home.privateFiles || [] : home.files || [])];
	const sourceIndex = sourceFiles.findIndex((file) => file.id === fileId);

	if (sourceIndex === -1) {
		throw createError({ statusCode: 404, message: "File not found" });
	}

	const [file] = sourceFiles.splice(sourceIndex, 1);
	const movedFile: HomeFile = {
		...file,
		visibility: targetVisibility,
		updatedAt: new Date().toISOString(),
	};

	targetFiles.unshift(movedFile);

	return {
		sourceKey,
		targetKey,
		sourceFiles,
		targetFiles,
		movedFile,
	};
}

export const MAX_HOME_FILE_NAME_LENGTH = 200;

/**
 * Normalises a user supplied file name: no path separators, no control
 * characters, no leading dots, and a hard length cap. Returns null when nothing
 * usable is left so callers can answer with a 400.
 */
export function sanitizeHomeFileName(input: unknown): string | null {
	if (typeof input !== "string") return null;

	const cleaned = input
		.replace(/[\u0000-\u001f\u007f]/g, "")
		.replace(/[/\\]/g, "-")
		.replace(/\s+/g, " ")
		.trim()
		// Leading dots and dashes are left over from stripped path segments
		// ("../../etc/passwd" -> "etc-passwd") and would hide the file on unix.
		.replace(/^[.\-\s]+/, "")
		.trim();

	if (!cleaned) return null;

	return cleaned.slice(0, MAX_HOME_FILE_NAME_LENGTH).trim() || null;
}

interface RenameHomeFileInput {
	home: Home;
	fileId: string;
	name: string;
}

export function renameHomeFileInHome({ home, fileId, name }: RenameHomeFileInput) {
	const visibilities: Array<"shared" | "private"> = ["shared", "private"];

	for (const visibility of visibilities) {
		const key = visibility === "private" ? "privateFiles" : "files";
		const files = [...(visibility === "private" ? home.privateFiles || [] : home.files || [])];
		const index = files.findIndex((file) => file.id === fileId);

		if (index === -1) continue;

		const renamedFile: HomeFile = {
			...files[index]!,
			name,
			updatedAt: new Date().toISOString(),
		};
		files[index] = renamedFile;

		return { key, files, renamedFile, visibility };
	}

	throw createError({ statusCode: 404, message: "File not found" });
}
