import { auth } from "../../useFirebaseAdmin";
import { updateHome, canEditHome } from "../../utils/homes";

export default defineEventHandler(async (event) => {
	try {
		const homeId = getRouterParam(event, "id");
		const body = await readBody(event);
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];

		if (!homeId) {
			throw createError({ statusCode: 400, message: "Home ID is required" });
		}

		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const decodedToken = await auth.verifyIdToken(idToken);

		const isOwner = !!decodedToken.owner || !!decodedToken.admin;
		const canEdit = await canEditHome(homeId, decodedToken.uid, !!decodedToken.admin);

		if (!canEdit) {
			throw createError({ statusCode: 403, message: "Forbidden: You cannot edit this home" });
		}

		const updatedHome = await updateHome(homeId, body);
		return updatedHome;
	} catch (e: any) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});