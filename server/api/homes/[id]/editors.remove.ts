import { db, auth } from "../../../useFirebaseAdmin";
import { canEditHome } from "../../../utils/homes";

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

		const { editorUid } = body;

		if (!editorUid || typeof editorUid !== "string") {
			throw createError({ statusCode: 400, message: "Editor UID is required" });
		}

		const home = await db.collection("homes").doc(homeId).get();
		if (!home.exists) {
			throw createError({ statusCode: 404, message: "Home not found" });
		}

		if (!home.data()!.ownerIds.includes(decodedToken.uid) && !decodedToken.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Only owners can remove editors" });
		}

		const editors = home.data()!.editors || [];
		const index = editors.indexOf(editorUid);

		if (index === -1) {
			throw createError({ statusCode: 404, message: "Editor not found" });
		}

		editors.splice(index, 1);

		await db.collection("homes").doc(homeId).update({
			editors,
			updatedAt: new Date().toISOString(),
		});

		const updatedHome = await db.collection("homes").doc(homeId).get();
		return { id: updatedHome.id, ...updatedHome.data() };
	} catch (e: any) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});