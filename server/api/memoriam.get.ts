import { requireOwnerOrAdmin } from "../utils/auth";
import { listMemoriamEntries } from "../utils/memoriam";

export default defineEventHandler(async (event) => {
	await requireOwnerOrAdmin(event);
	return listMemoriamEntries();
});
