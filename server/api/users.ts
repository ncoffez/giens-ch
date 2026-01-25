import { auth } from "../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	// Secure the API: Verify the requester is an admin
	const authHeader = getHeader(event, "Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}
	const idToken = authHeader.split("Bearer ")[1];
	if (!idToken) {
		throw createError({ statusCode: 401, message: "Invalid token format" });
	}
	try {
		const decodedToken = await auth.verifyIdToken(idToken);
		if (!decodedToken.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Admin access required" });
		}
	} catch (error) {
		throw createError({ statusCode: 401, message: "Invalid or expired token" });
	}

	const users = [];
	const listUsersResult = await auth.listUsers(50);
	users.push(...listUsersResult?.users);
	console.log(`API Users: fetched ${users.length} users`);
	return users;
});
