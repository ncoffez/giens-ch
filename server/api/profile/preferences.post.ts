import { db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const body = await readBody(event);
	const { homesFeatureEnabled } = body;

	if (typeof homesFeatureEnabled !== "boolean") {
		throw createError({ statusCode: 400, message: "homesFeatureEnabled must be a boolean" });
	}

	const uid = claims.uid;

	try {
		await db.collection("users").doc(uid).set(
			{
				homesFeatureEnabled,
				updatedAt: new Date().toISOString(),
			},
			{ merge: true }
		);

		return { success: true, homesFeatureEnabled };
	} catch (e: unknown) {
		throw createError({
			statusCode: 500,
			message: e instanceof Error ? e.message : "Failed to update preferences",
		});
	}
});