import { requireAreaPermission } from "../../../../../utils/permissionAccess";
import { removeMemoriamPhoto } from "../../../../../utils/memoriam";

export default defineEventHandler(async (event) => {
	await requireAreaPermission(event, "memoriam.manage");
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
