import { db } from "../useFirebaseAdmin";
import { getUserClaims } from "../utils/auth";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!claims.publisher && !claims.admin) {
		throw createError({ statusCode: 403, message: "Forbidden" });
	}

	const usersSnapshot = await db.collection("users")
		.where("publisher", "==", true)
		.get();

	const adminsSnapshot = await db.collection("users")
		.where("admin", "==", true)
		.get();

	const authorsMap = new Map<string, { id: string; name: string }>();

	usersSnapshot.docs.forEach((doc) => {
		const data = doc.data();
		authorsMap.set(doc.id, {
			id: doc.id,
			name: data.displayName || data.email || "Unknown",
		});
	});

	adminsSnapshot.docs.forEach((doc) => {
		const data = doc.data();
		authorsMap.set(doc.id, {
			id: doc.id,
			name: data.displayName || data.email || "Unknown",
		});
	});

	return Array.from(authorsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
});
