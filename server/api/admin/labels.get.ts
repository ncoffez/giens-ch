import { db } from "../../useFirebaseAdmin";
import { requireAdmin } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	await requireAdmin(event);

	const querySnapshot = await db.collection("labels").get();
	const labels: Array<Record<string, unknown> & { id: string }> = [];
	querySnapshot.forEach((doc) => labels.push({ ...doc.data(), id: doc.id }));
	return labels;
});
