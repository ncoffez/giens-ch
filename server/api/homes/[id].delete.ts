import { db, auth } from "../../useFirebaseAdmin";
import { deleteHome } from "../../utils/homes";

export default defineEventHandler(async (event) => {
	try {
		const homeId = getRouterParam(event, "id");
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];

		if (!homeId) {
			throw createError({ statusCode: 400, message: "Home ID is required" });
		}

		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const decodedToken = await auth.verifyIdToken(idToken);

		if (!decodedToken.owner && !decodedToken.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Only owners can delete homes" });
		}

		const home = await db.collection("homes").doc(homeId).get();
		if (!home.exists) {
			throw createError({ statusCode: 404, message: "Home not found" });
		}

		if (home.data()!.ownerId !== decodedToken.uid && !decodedToken.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: You can only delete your own homes" });
		}

		await deleteHome(homeId);
		return { success: true };
	} catch (e: any) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});