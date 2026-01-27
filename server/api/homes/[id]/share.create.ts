import { db, auth } from "../../../useFirebaseAdmin";
import { createShareLink, canEditHome } from "../../../utils/homes";

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

		const canEdit = await canEditHome(homeId, decodedToken.uid, !!decodedToken.admin);
		if (!canEdit) {
			throw createError({ statusCode: 403, message: "Forbidden: You cannot edit this home" });
		}

		const home = await db.collection("homes").doc(homeId).get();
		if (!home.exists) {
			throw createError({ statusCode: 404, message: "Home not found" });
		}

		const daysToExpire = body.daysToExpire || 7;
		const share = await createShareLink(homeId, decodedToken.uid, daysToExpire);

		return {
			shareUrl: `${getRequestProtocol(event)}://${getRequestHost(event)}/homes/view/${share.id}`,
			...share,
		};
	} catch (e: any) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});