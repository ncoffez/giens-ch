import { requireAreaPermission } from "../../../utils/permissionAccess";
import { reorderMemoriamEntries } from "../../../utils/memoriam";

export default defineEventHandler(async (event) => {
	await requireAreaPermission(event, "memoriam.manage");
	const body = await readBody(event);
	return reorderMemoriamEntries(body?.ids);
});
