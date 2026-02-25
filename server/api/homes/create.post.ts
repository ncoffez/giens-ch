import { db, auth } from "../../useFirebaseAdmin";
import { createHome, getGlobalSettings } from "../../utils/homes";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];

		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const decodedToken = await auth.verifyIdToken(idToken);

		if (!decodedToken.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Only admins can create homes" });
		}

		const { name, ownerIds, contact, wifiPassword, checkInInfo, checkOutInfo, mustKnows, houseRules, blanketsInfo, cleaningInfo, parkingNumber, washingMachineOverride, enabled } = body;

		if (!name || typeof name !== "string") {
			throw createError({ statusCode: 400, message: "Name is required" });
		}

		const settings = await getGlobalSettings();

		const existingHomes = await db.collection("homes").where("name", "==", name).limit(1).get();
		if (!existingHomes.empty) {
			throw createError({ statusCode: 409, message: "Home with this name already exists" });
		}

		const homeData = {
			name,
			ownerIds: ownerIds || [],
			enabled: enabled ?? true,
			contact: contact || {},
			wifiPassword,
			checkInInfo: checkInInfo || "",
			checkOutInfo: checkOutInfo || "",
			mustKnows: mustKnows || [],
			houseRules: houseRules || "",
			blanketsInfo: blanketsInfo || "",
			cleaningInfo: cleaningInfo || [],
			parkingNumber,
			washingMachineOverride,
		};

		const home = await createHome(decodedToken.uid, homeData);
		return home;
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});