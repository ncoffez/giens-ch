import { auth } from "../../useFirebaseAdmin";
import { bootstrapSecretMatches, getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	try {
		const claims = await getUserClaims(event);

		const secret = getHeader(event, "X-Bootstrap-Secret");
		const expected = process.env.BOOTSTRAP_SECRET;

		if (!bootstrapSecretMatches(expected, secret)) {
			throw createError({ statusCode: 401, message: "Invalid bootstrap secret" });
		}

		const uid = claims?.uid;
		if (!uid) {
			throw createError({ statusCode: 401, message: "Not authenticated" });
		}

		const existingClaims = (await auth.getUser(uid)).customClaims || {};

		if (existingClaims.admin === true) {
			throw createError({ statusCode: 400, message: "User already has admin privileges" });
		}

		await auth.setCustomUserClaims(uid, { admin: true });

		return {
			success: true,
			message: "User set as admin. You can now use the Admin UI.",
			uid
		};
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});