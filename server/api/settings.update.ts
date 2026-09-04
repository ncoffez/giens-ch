import { requireAdmin } from "../utils/auth";
import { pickGlobalSettingsPatch, updateGlobalSettings } from "../utils/homes";

export default defineEventHandler(async (event) => {
	await requireAdmin(event);

	const body = await readBody(event);
	const patch = pickGlobalSettingsPatch(body);

	if (patch.maxHomeNumber !== undefined && (typeof patch.maxHomeNumber !== "number" || patch.maxHomeNumber < 1)) {
		throw createError({ statusCode: 400, message: "maxHomeNumber must be a positive number" });
	}

	if (patch.washingMachineUse !== undefined && typeof patch.washingMachineUse !== "string") {
		throw createError({ statusCode: 400, message: "washingMachineUse must be a string" });
	}

	if (patch.homesFeatureGloballyEnabled !== undefined && typeof patch.homesFeatureGloballyEnabled !== "boolean") {
		throw createError({ statusCode: 400, message: "homesFeatureGloballyEnabled must be a boolean" });
	}

	return updateGlobalSettings(patch);
});
