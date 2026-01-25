import { auth } from "../useFirebaseAdmin";
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

	const users = [];
	const listUsersResult = await auth.listUsers(50);
	users.push(...listUsersResult?.users);
	console.log(`API Users: fetched ${users.length} users`);
	return users;
});
