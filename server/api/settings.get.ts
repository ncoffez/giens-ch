import { getGlobalSettings, updateGlobalSettings } from "../utils/homes";

export default defineEventHandler(async (event) => {
	try {
		const settings = await getGlobalSettings();
		return settings;
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});