import { db } from "../../../useFirebaseAdmin";
import { requireAreaPermission } from "../../../utils/permissionAccess";

export default defineEventHandler(async (event) => {
	try {
		await requireAreaPermission(event, "admin.homes.manage");

		const query = db.collection("homes").orderBy("name");
		const snapshot = await query.get();
		const homes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

		return homes;
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});