import { getGlobalSettings, updateGlobalSettings } from "../utils/homes";

export default defineEventHandler(async (event) => {
	try {
		const settings = await getGlobalSettings();
		return settings;
	} catch (e: unknown) {
		const error = e instanceof Error ? e : new Error(String(e));
		throw createError({
			statusCode: (error as { statusCode?: number }).statusCode || 500,
			message: error.message || "Internal Server Error",
		});
	}
});