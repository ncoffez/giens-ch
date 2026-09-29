import { db } from "../../useFirebaseAdmin";
import { getHomeById } from "../../utils/homes";
import { assertHomeReadable } from "../../utils/permissionAccess";
import { canEditHomeSection } from "#shared/sitePermissions";
import { cleanContact, syncHomeContacts } from "../../utils/homeContacts";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	const access = await assertHomeReadable(event, homeId);
	const home = await getHomeById(homeId);
	if (!home) {
		throw createError({ statusCode: 404, message: "Home not found" });
	}

	const syncedContacts = await syncHomeContacts(home);
	const didContactsChange = JSON.stringify(syncedContacts) !== JSON.stringify(home.contacts || []);

	if (didContactsChange) {
		home.contacts = syncedContacts;
		const cleanedContacts = syncedContacts.map(cleanContact);
		await db.collection("homes").doc(homeId).update({ contacts: cleanedContacts });
	}

	const response = { ...home };
	if (!canEditHomeSection(access.config, access.claims, access.listed, "home.wifi.edit")) {
		response.wifiSSID = "";
		response.wifiPassword = "";
	}
	if (!canEditHomeSection(access.config, access.claims, access.listed, "home.instructions.edit")) {
		response.instructions = "";
		response.instructionsByLocale = {};
	}
	if (!canEditHomeSection(access.config, access.claims, access.listed, "home.photos.upload")) {
		response.photos = [];
	}
	if (!canEditHomeSection(access.config, access.claims, access.listed, "home.files.upload")) {
		response.files = [];
		response.privateFiles = [];
		response.folders = [];
	}
	if (!canEditHomeSection(access.config, access.claims, access.listed, "home.contacts.manage")) {
		response.contacts = [];
	}

	return response;
});
