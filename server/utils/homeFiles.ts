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
