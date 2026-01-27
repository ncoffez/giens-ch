import { db, auth } from "../../../useFirebaseAdmin";
import { canEditHome } from "../../../utils/homes";
import * as admin from "firebase-admin";

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

		const { email } = body;

		if (!email || typeof email !== "string") {
			throw createError({ statusCode: 400, message: "Editor email is required" });
		}

		const home = await db.collection("homes").doc(homeId).get();
		if (!home.exists) {
			throw createError({ statusCode: 404, message: "Home not found" });
		}

		if (home.data()!.ownerId !== decodedToken.uid && !decodedToken.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Only owners can add editors" });
		}

		let editorUid;
		try {
			editorUid = email.includes("@") ? email : email;
		} catch (e) {
			throw createError({ statusCode: 400, message: "Invalid email format" });
		}

		const userQuery = await admin.auth().getUserByEmail(email);
		editorUid = userQuery.uid;

		if (home.data()!.editors.includes(editorUid)) {
			throw createError({ statusCode: 409, message: "User is already an editor" });
		}

		const editors = [...(home.data()!.editors || []), editorUid];

		await db.collection("homes").doc(homeId).update({
			editors,
			updatedAt: new Date().toISOString(),
		});

		const updatedHome = await db.collection("homes").doc(homeId).get();
		return { id: updatedHome.id, ...updatedHome.data() };
	} catch (e: any) {
		if (e.code === "auth/user-not-found") {
			throw createError({ statusCode: 404, message: "User not found or does not have an account" });
		}
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});