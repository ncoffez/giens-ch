import { requireAdmin } from "../../../../../utils/auth";
import { addMemoriamPhoto } from "../../../../../utils/memoriam";

export default defineEventHandler(async (event) => {
	await requireAdmin(event);
	const id = getRouterParam(event, "id");
	const body = await readBody(event);

	if (!id) {
		throw createError({ statusCode: 400, message: "Memoriam ID is required" });
	}

	if (!body?.file) {
		throw createError({ statusCode: 400, message: "File is required" });
	}

	return addMemoriamPhoto(id, body.file, body.type);
});
