import { requireAreaPermission } from "../../utils/permissionAccess";
import { listMemoriamEntries } from "../../utils/memoriam";

export default defineEventHandler(async (event) => {
	await requireAreaPermission(event, "memoriam.manage");
	return listMemoriamEntries();
});
