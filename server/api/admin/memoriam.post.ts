import { requireAreaPermission } from "../../utils/permissionAccess";
import { createMemoriamEntry } from "../../utils/memoriam";

export default defineEventHandler(async (event) => {
	const { claims } = await requireAreaPermission(event, "memoriam.manage");
	const body = await readBody(event);
	return createMemoriamEntry(body || {}, claims.uid);
});
