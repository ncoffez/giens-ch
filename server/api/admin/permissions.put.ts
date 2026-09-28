import { requireAreaPermission } from "../../utils/permissionAccess";
import { loadFolderRefs, savePermissionConfig } from "../../utils/permissionConfig";
import { sanitizePermissionConfig } from "../../../shared/sitePermissions";

export default defineEventHandler(async (event) => {
	const { claims } = await requireAreaPermission(event, "admin.permissions.manage");
	const body = await readBody(event);
	if (!body || typeof body !== "object") {
		throw createError({ statusCode: 400, message: "Permission payload is required" });
	}

	const folderIds = new Set((await loadFolderRefs()).map((folder) => folder.id));
	const next = sanitizePermissionConfig({
		grants: (body as { grants?: unknown }).grants,
		folders: (body as { folders?: unknown }).folders,
	}, folderIds);
	const audit = await savePermissionConfig(next, claims.uid || "");

	return { ok: true, audit };
});
