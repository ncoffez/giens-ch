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

		const { maxHomeNumber, washingMachineUse, homesFeatureEnabled } = body;

		if (maxHomeNumber !== undefined && (typeof maxHomeNumber !== "number" || maxHomeNumber < 1)) {
			throw createError({ statusCode: 400, message: "maxHomeNumber must be a positive number" });
		}

		if (washingMachineUse !== undefined && typeof washingMachineUse !== "string") {
			throw createError({ statusCode: 400, message: "washingMachineUse must be a string" });
		}

		if (homesFeatureEnabled !== undefined && typeof homesFeatureEnabled !== "boolean") {
			throw createError({ statusCode: 400, message: "homesFeatureEnabled must be a boolean" });
		}

		const updatedSettings = await updateGlobalSettings({ maxHomeNumber, washingMachineUse, homesFeatureEnabled });
		return updatedSettings;
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});