import { requireAdmin } from "../../utils/auth";
import { createMemoriamEntry } from "../../utils/memoriam";

export default defineEventHandler(async (event) => {
	const claims = await requireAdmin(event);
	const body = await readBody(event);
	return createMemoriamEntry(body || {}, claims.uid);
});
