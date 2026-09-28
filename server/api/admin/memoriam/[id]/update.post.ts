import { requireAreaPermission } from "../../../../utils/permissionAccess";
import { updateMemoriamEntry } from "../../../../utils/memoriam";

export default defineEventHandler(async (event) => {
	const { claims } = await requireAreaPermission(event, "memoriam.manage");
	const id = getRouterParam(event, "id");

	if (!id) {
		throw createError({ statusCode: 400, message: "Memoriam ID is required" });
	}

	const body = await readBody(event);
	return updateMemoriamEntry(id, body || {}, claims.uid);
});
