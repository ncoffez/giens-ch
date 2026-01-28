import { auth } from "../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	try {
		const claims = await getUserClaims(event);

		if (!claims || !claims.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Admin access required" });
		}

		const allUsersResult = await auth.listUsers(1000);
		const owners: Array<{ uid: string; email: string; displayName: string }> = [];

		for (const userRecord of allUsersResult.users) {
			owners.push({
				uid: userRecord.uid,
				email: userRecord.email || "",
				displayName: userRecord.displayName || userRecord.email?.split("@")[0] || "",
			});
		}

		return owners;
	} catch (e: any) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});