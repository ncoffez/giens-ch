import { auth, db } from "../../../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	const idToken = event.headers.get("authorization")?.split("Bearer ")[1];

	if (!idToken) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const decodedToken = await auth.verifyIdToken(idToken);
	if (!decodedToken.admin) {
		throw createError({ statusCode: 403, message: "Forbidden: Admin access required" });
	}

	const labelId = getRouterParam(event, "id");
	if (!labelId) {
		throw createError({ statusCode: 400, message: "Label-ID fehlt." });
	}

	const body = await readBody(event);
	if (typeof body?.private !== "boolean") {
		throw createError({ statusCode: 400, message: "private must be a boolean" });
	}

	const labelRef = db.collection("labels").doc(labelId);
	const existing = await labelRef.get();
	if (!existing.exists) {
		throw createError({ statusCode: 404, message: `Label '${labelId}' nicht gefunden.` });
	}

	await labelRef.update({ private: body.private });
	const updated = await labelRef.get();

	return { id: updated.id, ...updated.data() };
});
