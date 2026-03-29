import { auth, db } from "../../useFirebaseAdmin";
import { getHomeById, isHomeOwner } from "../../utils/homes";
import { getUserClaims } from "../../utils/auth";
import type { Home, HomeContact } from "../../../types";

async function getOwnerInfo(uid: string): Promise<{ displayName: string | null; photoURL: string | null }> {
	try {
		const userRecord = await auth.getUser(uid);
		const userDoc = await db.collection("users").doc(uid).get();
		const firestoreData = userDoc.exists ? userDoc.data() : null;
		return {
			displayName: firestoreData?.displayName || userRecord.displayName || null,
			photoURL: firestoreData?.photoURL || userRecord.photoURL || null,
		};
	} catch {
		return { displayName: null, photoURL: null };
	}
}

function cleanContact(contact: HomeContact): Record<string, unknown> {
	const cleaned: Record<string, unknown> = {
		id: contact.id,
		name: contact.name,
		hidden: contact.hidden,
		isOwner: contact.isOwner,
	};
	if (contact.email) cleaned.email = contact.email;
	if (contact.phone) cleaned.phone = contact.phone;
	if (contact.notes) cleaned.notes = contact.notes;
	if (contact.avatar) cleaned.avatar = contact.avatar;
	return cleaned;
}

async function migrateLegacyContacts(home: Home): Promise<HomeContact[]> {
	const contacts: HomeContact[] = [];
	
	// Add legacy ownerEmail/ownerPhone as a contact
	if (home.ownerEmail || home.ownerPhone) {
		const legacyContact: HomeContact = {
			id: "legacy-contact",
			name: "Kontakt",
			email: home.ownerEmail || undefined,
			phone: home.ownerPhone || undefined,
			hidden: false,
			isOwner: false,
		};
		contacts.push(legacyContact);
	}
	
	// Add owners with their display info
	for (const uid of home.ownerIds || []) {
		const ownerInfo = await getOwnerInfo(uid);
		const ownerContact: HomeContact = {
			id: `owner-${uid}`,
			name: ownerInfo.displayName || "Eigentümer",
			hidden: false,
			isOwner: true,
		};
		if (ownerInfo.photoURL) {
			ownerContact.avatar = ownerInfo.photoURL;
		}
		contacts.push(ownerContact);
	}
	
	return contacts;
}

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

	// Migrate contacts if not present
	if (!home.contacts || home.contacts.length === 0) {
		home.contacts = await migrateLegacyContacts(home);
		// Save migrated contacts (clean undefined values for Firestore)
		const cleanedContacts = home.contacts.map(cleanContact);
		await db.collection("homes").doc(homeId).update({ contacts: cleanedContacts });
	}

	// Populate owner avatars
	for (const contact of home.contacts) {
		if (contact.isOwner && !contact.avatar) {
			const uid = contact.id.replace("owner-", "");
			const ownerInfo = await getOwnerInfo(uid);
			contact.name = ownerInfo.displayName || contact.name;
			if (ownerInfo.photoURL) {
				contact.avatar = ownerInfo.photoURL;
			}
		}
	}

	return home;
});
