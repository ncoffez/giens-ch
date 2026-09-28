import { requireAreaPermission } from "../../../../utils/permissionAccess";
import { deleteMemoriamEntry } from "../../../../utils/memoriam";

export default defineEventHandler(async (event) => {
	await requireAreaPermission(event, "memoriam.manage");
	const id = getRouterParam(event, "id");

	if (!id) {
		throw createError({ statusCode: 400, message: "Memoriam ID is required" });
	}

	await deleteMemoriamEntry(id);
	return { success: true };
});
