import { requireAdmin } from "../../../utils/auth";
import { reorderMemoriamEntries } from "../../../utils/memoriam";

export default defineEventHandler(async (event) => {
	await requireAdmin(event);
	const body = await readBody(event);
	return reorderMemoriamEntries(body?.ids);
});
