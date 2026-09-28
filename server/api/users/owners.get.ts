import { auth } from "../../useFirebaseAdmin";
import { requireAnyAreaPermission } from "../../utils/permissionAccess";

export default defineEventHandler(async (event) => {
	try {
		await requireAnyAreaPermission(event, ["admin.users.manage", "admin.homes.manage"]);

		const allUsersResult = await auth.listUsers(1000);
		const owners: Array<{ uid: string; email: string; displayName: string; photoURL?: string }> = [];

		for (const userRecord of allUsersResult.users) {
			owners.push({
				uid: userRecord.uid,
				email: userRecord.email || "",
				displayName: userRecord.displayName || userRecord.email?.split("@")[0] || "",
				photoURL: userRecord.photoURL || undefined
			});
		}

		return owners;
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});