import { createHome } from "../../../utils/homes";
import { requireAreaPermission } from "../../../utils/permissionAccess";

export default defineEventHandler(async (event) => {
	await requireAreaPermission(event, "admin.homes.manage");

	const body = await readBody<{ name?: string }>(event);
	const name = body?.name?.trim();

	if (!name) {
		throw createError({ statusCode: 400, message: "Name is required" });
	}

	const home = await createHome(name);

	return home;
});
