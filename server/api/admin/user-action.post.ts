import { auth } from "../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	// In a real app, you'd verify the requester is an admin here
	// For now, we assume the middleware handles page access, but API should be protected too.
	
	const body = await readBody(event);
	const { action, uid, email, displayName, password, disabled } = body;

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
				// In a real app, you might send this via email. 
				// For this prototype, we'll return it so the admin can copy it or we'll just say success.
				return { success: true, link };

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
