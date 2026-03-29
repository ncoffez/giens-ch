import { createHome } from "../../../utils/homes";
import { getUserClaims } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);

	if (!claims || !claims.admin) {
		throw createError({ statusCode: 403, message: "Forbidden: Admin access required" });
	}

	const body = await readBody<{ name?: string }>(event);
	const name = body?.name?.trim();

	if (!name) {
		throw createError({ statusCode: 400, message: "Name is required" });
	}

	const home = await createHome(name);

	return home;
});
