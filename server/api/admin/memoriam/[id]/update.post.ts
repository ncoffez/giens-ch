import { requireAdmin } from "../../../../utils/auth";
import { updateMemoriamEntry } from "../../../../utils/memoriam";

export default defineEventHandler(async (event) => {
	const claims = await requireAdmin(event);
	const id = getRouterParam(event, "id");

	if (!id) {
		throw createError({ statusCode: 400, message: "Memoriam ID is required" });
	}

	const body = await readBody(event);
	return updateMemoriamEntry(id, body || {}, claims.uid);
});
