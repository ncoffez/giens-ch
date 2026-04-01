import { db } from "../useFirebaseAdmin";

interface DocumentClaims {
	admin?: boolean;
	owner?: boolean;
	uid?: string;
}

interface GlobalFileRecord {
	uploadedBy?: string;
	deletedAt?: string;
}

interface GlobalFolderRecord {
	createdBy?: string;
}

interface FolderDeletionValidationInput {
	claims: DocumentClaims | null | undefined;
	rootFolder: GlobalFolderRecord | null | undefined;
	descendantFolders?: Array<GlobalFolderRecord | null | undefined>;
	activeFiles?: Array<GlobalFileRecord | null | undefined>;
}

export function canManageGlobalDocuments(claims: DocumentClaims | null | undefined) {
	return !!(claims?.admin || claims?.owner);
}

export function canDeleteGlobalFile(claims: DocumentClaims | null | undefined, file: GlobalFileRecord | null | undefined) {
	if (!claims || !file) return false;
	if (claims.admin) return true;
	return !!claims.uid && file.uploadedBy === claims.uid;
}

export function canDeleteGlobalFolder(claims: DocumentClaims | null | undefined, folder: GlobalFolderRecord | null | undefined) {
	if (!claims || !folder) return false;
	if (claims.admin) return true;
	return !!claims.uid && folder.createdBy === claims.uid;
}

export async function collectGlobalFolderTree(rootFolderId: string) {
	const descendants: string[] = [rootFolderId];
	const queue: string[] = [rootFolderId];

	while (queue.length > 0) {
		const currentId = queue.shift();
		if (!currentId) continue;

		const childrenSnapshot = await db.collection("globalFolders").where("parentId", "==", currentId).get();
		for (const childDoc of childrenSnapshot.docs) {
			descendants.push(childDoc.id);
			queue.push(childDoc.id);
		}
	}

	return descendants;
}

export function getGlobalFolderDeletionError({
	claims,
	rootFolder,
	descendantFolders = [],
	activeFiles = [],
}: FolderDeletionValidationInput) {
	if (!canDeleteGlobalFolder(claims, rootFolder)) {
		return "You can only delete your own folders";
	}

	if (descendantFolders.some(folder => !canDeleteGlobalFolder(claims, folder))) {
		return "You can only delete your own folders";
	}

	if (activeFiles.some(file => !canDeleteGlobalFile(claims, file))) {
		return "You can only delete folders containing your own files";
	}

	return null;
}
