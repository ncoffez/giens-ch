import { requireAdmin } from "../../../../../utils/auth";
import { removeMemoriamPhoto } from "../../../../../utils/memoriam";

export default defineEventHandler(async (event) => {
	await requireAdmin(event);
	const id = getRouterParam(event, "id");
	const body = await readBody(event);

	if (!id) {
		throw createError({ statusCode: 400, message: "Memoriam ID is required" });
	}

	if (!body?.photoUrl || typeof body.photoUrl !== "string") {
		throw createError({ statusCode: 400, message: "Photo URL is required" });
	}

	await removeMemoriamPhoto(id, body.photoUrl);
	return { success: true };
});
