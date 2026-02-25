import { auth, db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	// Secure the API: Verify the requester is an admin
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}
	if (!claims.admin) {
		throw createError({ statusCode: 403, message: "Forbidden: Admin access required" });
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

			case "update-name":
				if (!uid || !displayName) {
					throw createError({ statusCode: 400, message: "UID and displayName are required" });
				}
				await auth.updateUser(uid, { displayName });
				
				// Sync articles
				const articlesSnapshot = await db.collection("articles")
					.where("authorUid", "==", uid)
					.get();

				if (!articlesSnapshot.empty) {
					const batch = db.batch();
					articlesSnapshot.forEach(doc => {
						batch.update(doc.ref, { author: displayName });
					});
					await batch.commit();
				}
				return { success: true };

			default:
				throw createError({ statusCode: 400, message: "Invalid action" });
		}
	} catch (error: unknown) {
		throw createError({
			statusCode: error.statusCode || 500,
			message: error.message || "An error occurred",
		});
	}
});
