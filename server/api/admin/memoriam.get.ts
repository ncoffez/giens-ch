import { requireAdmin } from "../../utils/auth";
import { listMemoriamEntries } from "../../utils/memoriam";

export default defineEventHandler(async (event) => {
	await requireAdmin(event);
	return listMemoriamEntries();
});
