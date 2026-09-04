import { initializeHomes } from "../../../utils/homeInit";
import { requireAdmin } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
	try {
		await requireAdmin(event);

		const { maxHomeNumber } = getQuery(event);
		const result = await initializeHomes(Number(maxHomeNumber) || 30);

		return {
			created: result.created,
			existing: result.existing,
			total: result.created + result.existing,
		};
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});