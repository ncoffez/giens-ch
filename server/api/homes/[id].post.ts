import { getHomeById, updateHome, isHomeOwner } from "../../utils/homes";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");
	const body = await readBody(event);

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const isAdmin = !!claims.admin;
	const isOwner = await isHomeOwner(homeId, claims.uid);

	if (!isAdmin && !isOwner) {
		throw createError({
			statusCode: 403,
			message: "Forbidden: You cannot edit this home",
		});
	}

	// Filter allowed fields
	const allowedFields = ["name", "photos", "wifiSSID", "wifiPassword", "instructions", "files", "folders", "contacts"];
	const filteredBody: Record<string, unknown> = {};
	for (const key of allowedFields) {
		if (body[key] !== undefined) {
			filteredBody[key] = body[key];
		}
	}

	const updated = await updateHome(homeId, filteredBody);
	return updated;
});
