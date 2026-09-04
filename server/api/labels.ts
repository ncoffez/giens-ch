import { db } from "../useFirebaseAdmin";

export default defineEventHandler(async (_event) => {
	const querySnapshot = await db.collection("labels").get();
	const labels: any[] = [];
	querySnapshot.forEach((doc) => labels.push({ ...doc.data(), id: doc.id }));
	return labels;
});
