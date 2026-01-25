import { auth } from "../../useFirebaseAdmin";

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
	
	const body = await readBody(event);
	const { action, uid, email, displayName, password, disabled, roles } = body;

	try {
		switch (action) {
			case "add":
				if (!email || !password) {
					throw createError({ statusCode: 400, message: "Email and password are required" });
				}
				const newUser = await auth.createUser({
					email,
					password,
					displayName: displayName || email.split("@")[0],
				});
				return { success: true, user: newUser };

			case "delete":
				if (!uid) {
					throw createError({ statusCode: 400, message: "UID is required" });
				}
				await auth.deleteUser(uid);
				return { success: true };

			case "toggle-status":
				if (!uid) {
					throw createError({ statusCode: 400, message: "UID is required" });
				}
				await auth.updateUser(uid, { disabled });
				return { success: true };

			case "reset-password":
				if (!email) {
					throw createError({ statusCode: 400, message: "Email is required" });
				}
				const link = await auth.generatePasswordResetLink(email);
				return { success: true, link };

			case "set-roles":
				if (!uid || !roles) {
					throw createError({ statusCode: 400, message: "UID and roles are required" });
				}
				await auth.setCustomUserClaims(uid, roles);
				return { success: true };

			default:
				throw createError({ statusCode: 400, message: "Invalid action" });
		}
	} catch (error: any) {
		throw createError({
			statusCode: error.statusCode || 500,
			message: error.message || "An error occurred",
		});
	}
});
