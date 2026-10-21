import { createError } from "h3";
import {
	documentDeleteScope,
	type DeleteBlockReason,
	type DeleteScope,
	type PermissionClaimSet,
} from "#shared/sitePermissions";
import { loadFolderRefs, loadPermissionConfig } from "./permissionConfig";

const DELETE_BLOCK_MESSAGES: Record<DeleteBlockReason, string> = {
	"forbidden": "Forbidden",
	"not-own": "You can only delete files and folders you created yourself",
	"foreign-content": "This folder contains files or folders created by someone else. Only users who may delete everything can delete it",
};

export async function loadDeleteScope(claims: PermissionClaimSet, folderId: string | null): Promise<DeleteScope> {
	const [config, folders] = await Promise.all([
		loadPermissionConfig(),
		loadFolderRefs(),
	]);
	return documentDeleteScope(config, folders, claims, folderId);
}

export function deleteForbidden(reason: DeleteBlockReason) {
	return createError({
		statusCode: 403,
		message: DELETE_BLOCK_MESSAGES[reason],
		data: { reason },
	});
}
