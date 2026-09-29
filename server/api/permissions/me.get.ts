import { getUserClaims } from "../../utils/auth";
import { loadFolderRefs, loadPermissionConfig } from "../../utils/permissionConfig";
import { PERMISSION_ROWS, canAccessDocuments, canPerform } from "#shared/sitePermissions";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	const [config, folders] = await Promise.all([
		loadPermissionConfig(),
		loadFolderRefs(),
	]);
	const actions: Record<string, boolean> = {};

	for (const row of PERMISSION_ROWS) {
		actions[row.key] = canPerform(config, claims, row.key);
	}
	actions["documents.access"] = canAccessDocuments(config, folders, claims);

	return { actions };
});
