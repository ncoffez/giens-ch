import { auth } from "../useFirebaseAdmin";
import { toAdminUserListItem } from "../utils/adminUsers";
import { getUserClaims } from "../utils/auth";

export default defineEventHandler(async (event) => {
	// Secure the API: Verify the requester is an admin
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}
	if (!claims.admin) {
		throw createError({ statusCode: 403, message: "Forbidden: Admin access required" });
	}

	const listUsersResult = await auth.listUsers(50);
	const authUsers = listUsersResult?.users || [];

	// Merge with Firestore data for consistent profiles
	const { db } = await import("../useFirebaseAdmin");
	const firestoreUsersSnapshot = await db.collection("users").get();
	const firestoreUsersMap = new Map();
	firestoreUsersSnapshot.forEach(doc => {
		firestoreUsersMap.set(doc.id, doc.data());
	});

	const users = authUsers.map((user) => {
		const firestoreData = firestoreUsersMap.get(user.uid);
		return toAdminUserListItem(user, firestoreData);
	});

	return users;
});
