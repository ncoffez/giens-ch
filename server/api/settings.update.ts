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

		const { maxHomeNumber, washingMachineUse, homesFeatureGloballyEnabled } = body;

		if (maxHomeNumber !== undefined && (typeof maxHomeNumber !== "number" || maxHomeNumber < 1)) {
			throw createError({ statusCode: 400, message: "maxHomeNumber must be a positive number" });
		}

		if (washingMachineUse !== undefined && typeof washingMachineUse !== "string") {
			throw createError({ statusCode: 400, message: "washingMachineUse must be a string" });
		}

		if (homesFeatureGloballyEnabled !== undefined && typeof homesFeatureGloballyEnabled !== "boolean") {
			throw createError({ statusCode: 400, message: "homesFeatureGloballyEnabled must be a boolean" });
		}

		const updatedSettings = await updateGlobalSettings({ maxHomeNumber, washingMachineUse, homesFeatureGloballyEnabled });
		return updatedSettings;
	} catch (e: unknown) {
		const error = e instanceof Error ? e : new Error(String(e));
		throw createError({
			statusCode: (error as { statusCode?: number }).statusCode || 500,
			message: error.message || "Internal Server Error",
		});
	}
});