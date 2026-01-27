import { db } from "../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	try {
		const claims = await getUserClaims(event);

		if (!claims || !claims.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Admin access required" });
		}

		const usersRef = db.collection("users");
		const snapshot = await usersRef.get();

		const users = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				uid: data.uid || doc.id,
				email: data.email || "",
				displayName: data.displayName || data.email?.split("@")[0] || "",
				admin: !!data.admin,
				owner: !!data.owner,
				isOwner: !!data.owner,
				isAdmin: !!data.admin,
			};
		});

		const filteredUsers = users.filter((user) => user.isOwner || user.isAdmin);

		return filteredUsers;
	} catch (e: any) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});