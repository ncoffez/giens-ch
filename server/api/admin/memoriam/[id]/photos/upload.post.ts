import { requireAreaPermission } from "../../../../../utils/permissionAccess";
import { addMemoriamPhoto } from "../../../../../utils/memoriam";
import { withUploadTiming } from "../../../../../utils/uploadTiming";

export default defineEventHandler(withUploadTiming("/api/admin/memoriam/[id]/photos/upload", async (event, timer) => {
	await requireAreaPermission(event, "memoriam.manage");
	const id = getRouterParam(event, "id");
	const body = await readBody(event);

	if (!id) {
		throw createError({ statusCode: 400, message: "Memoriam ID is required" });
	}

	if (!body?.file) {
		throw createError({ statusCode: 400, message: "File is required" });
	}

	timer.set({
		fileSize: typeof body.file === "string" ? Math.floor((body.file.split(";base64,").pop() || "").length * 3 / 4) : 0,
		contentType: body.type || "image/jpeg",
	});
	return await timer.measure("storage", () => addMemoriamPhoto(id, body.file, body.type));
}));
