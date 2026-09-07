import { requireAdmin } from "../../../../utils/auth";
import { deleteMemoriamEntry } from "../../../../utils/memoriam";

export default defineEventHandler(async (event) => {
	await requireAdmin(event);
	const id = getRouterParam(event, "id");

	if (!id) {
		throw createError({ statusCode: 400, message: "Memoriam ID is required" });
	}

	await deleteMemoriamEntry(id);
	return { success: true };
});
