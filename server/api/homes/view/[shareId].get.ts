import { getShareLink, incrementShareAccess } from "../../../utils/homes";
import { auth, db } from "../../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	try {
		const shareId = getRouterParam(event, "shareId");

		if (!shareId) {
			throw createError({ statusCode: 400, message: "Share ID is required" });
		}

		const share = await getShareLink(shareId);

		if (!share) {
			throw createError({ statusCode: 404, message: "Share link not found or expired" });
		}

		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];
		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized: Authentication required" });
		}

		await auth.verifyIdToken(idToken);

		await incrementShareAccess(shareId);

		const home = await db.collection("homes").doc(share.homeId).get();
		if (!home.exists) {
			throw createError({ statusCode: 404, message: "Home not found" });
		}

		const homeData = home.data();

		if (!homeData || !homeData.enabled) {
			throw createError({ statusCode: 404, message: "Home not available" });
		}

		return { share, home: { id: home.id, ...homeData } };
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});