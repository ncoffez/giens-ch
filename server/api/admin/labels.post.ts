import { auth, db } from "../../useFirebaseAdmin";

function normalizeLabelId(raw: unknown): string | null {
	if (typeof raw !== "string") {
		return null;
	}

	const id = raw.trim().toLowerCase();
	if (id.length < 2 || !/^[a-z0-9-]+$/.test(id)) {
		return null;
	}

	return id;
}

export default defineEventHandler(async (event) => {
	const idToken = event.headers.get("authorization")?.split("Bearer ")[1];

	if (!idToken) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const decodedToken = await auth.verifyIdToken(idToken);
	if (!decodedToken.admin) {
		throw createError({ statusCode: 403, message: "Forbidden: Admin access required" });
	}

	const body = await readBody(event);
	const labelId = normalizeLabelId(body?.id);

	if (!labelId) {
		throw createError({
			statusCode: 400,
			message: "Label-ID muss mindestens 2 Zeichen haben und darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.",
		});
	}

	const existing = await db.collection("labels").doc(labelId).get();
	if (existing.exists) {
		throw createError({ statusCode: 409, message: `Label '${labelId}' existiert bereits.` });
	}

	const title = labelId.charAt(0).toUpperCase() + labelId.slice(1);
	const label = {
		title,
		name: labelId,
		private: false,
	};

	await db.collection("labels").doc(labelId).set(label);

	return { id: labelId, ...label };
});
