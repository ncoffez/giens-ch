import { db } from "../../../../useFirebaseAdmin";
import { requireAreaPermission } from "../../../../utils/permissionAccess";

export default defineEventHandler(async (event) => {
	try {
		await requireAreaPermission(event, "admin.homes.manage");

		const homeId = getRouterParam(event, "id");

		if (!homeId) {
			throw createError({ statusCode: 400, message: "Home ID is required" });
		}

		await db.collection("homes").doc(homeId).delete();

		return { success: true };
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});