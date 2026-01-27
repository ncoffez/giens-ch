import { auth } from "../useFirebaseAdmin";
import { getGlobalSettings, updateGlobalSettings } from "../utils/homes";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];

		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const decodedToken = await auth.verifyIdToken(idToken);

		if (!decodedToken.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Admin access required" });
		}

		const { maxHomeNumber, washingMachineUse } = body;

		if (maxHomeNumber !== undefined && (typeof maxHomeNumber !== "number" || maxHomeNumber < 1)) {
			throw createError({ statusCode: 400, message: "maxHomeNumber must be a positive number" });
		}

		if (washingMachineUse !== undefined && typeof washingMachineUse !== "string") {
			throw createError({ statusCode: 400, message: "washingMachineUse must be a string" });
		}

		const updatedSettings = await updateGlobalSettings({ maxHomeNumber, washingMachineUse });
		return updatedSettings;
	} catch (e: any) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});