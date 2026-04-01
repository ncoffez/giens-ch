import { db } from "../../../useFirebaseAdmin";
import { getHomeById } from "../../../utils/homes";
import { getShareLink, incrementShareAccess } from "../../../utils/homes";
import { cleanContact, syncHomeContacts } from "../../../utils/homeContacts";

export default defineEventHandler(async (event) => {
	const token = getRouterParam(event, "token");

	if (!token) {
		throw createError({ statusCode: 400, message: "Share token is required" });
	}

	const share = await getShareLink(token);
	if (!share) {
		throw createError({
			statusCode: 404,
			message: "Share link not found, expired, or revoked",
		});
	}

	const home = await getHomeById(share.homeId);
	if (!home) {
		throw createError({ statusCode: 404, message: "Home not found" });
	}

	// Increment access count
	await incrementShareAccess(token);

	const syncedContacts = await syncHomeContacts(home);
	const didContactsChange = JSON.stringify(syncedContacts) !== JSON.stringify(home.contacts || []);

	if (didContactsChange) {
		home.contacts = syncedContacts;
		const cleanedContacts = syncedContacts.map(cleanContact);
		await db.collection("homes").doc(share.homeId).update({ contacts: cleanedContacts });
	}

	// Populate owner avatars and filter hidden contacts
	const visibleContacts = [];
	for (const contact of home.contacts) {
		if (contact.hidden) continue;
		visibleContacts.push(contact);
	}

	return {
		home: {
			...home,
			files: (home.files || []).filter((file) => file.visibility !== "private"),
			privateFiles: [],
		},
		share,
		contacts: visibleContacts,
	};
});
