import { db } from "../../useFirebaseAdmin";
import { requireAreaPermission } from "../../utils/permissionAccess";
import { buildPermissionCatalog, loadFolderRefs, loadPermissionRecord } from "../../utils/permissionConfig";
import { DOCUMENT_ACTIONS, SITE_ROLES, folderActionGrants } from "../../../shared/sitePermissions";

export default defineEventHandler(async (event) => {
	await requireAreaPermission(event, "admin.permissions.manage");
	const [{ config, updatedAt, updatedBy, audit }, folderRefs, folderSnapshot] = await Promise.all([
		loadPermissionRecord(),
		loadFolderRefs(),
		db.collection("globalFolders").get(),
	]);
	const names = new Map(folderSnapshot.docs.map((doc) => [doc.id, String(doc.data().name || doc.id)]));

	return {
		roles: SITE_ROLES,
		rows: buildPermissionCatalog(config),
		folders: folderRefs.map((folder) => ({
			id: folder.id,
			name: names.get(folder.id) || folder.id,
			parentId: folder.parentId,
			actions: Object.fromEntries(DOCUMENT_ACTIONS.map((action) => {
				const resolved = folderActionGrants(config, folderRefs, folder.id, action);
				return [action, { grants: resolved.grants, explicit: resolved.explicit }];
			})),
		})),
		updatedAt,
		updatedBy,
		audit,
	};
});
