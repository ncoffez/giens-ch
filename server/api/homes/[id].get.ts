import { db } from "../../useFirebaseAdmin";
import { getHomeById, isHomeOwner } from "../../utils/homes";
import { getUserClaims } from "../../utils/auth";
import { cleanContact, syncHomeContacts } from "../../utils/homeContacts";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");

	if (!homeId) {
		throw createError({ statusCode: 400, message: "Home ID is required" });
	}

	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const isOwner = await isHomeOwner(homeId, claims.uid);

	if (!isOwner) {
		throw createError({
			statusCode: 403,
			message: "Forbidden: You don't have access to this home",
		});
	}

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

	return home;
});
