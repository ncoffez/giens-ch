import { auth, db } from "../../../useFirebaseAdmin";
import { getHomeById } from "../../../utils/homes";
import { getShareLink, incrementShareAccess } from "../../../utils/homes";
import type { Home, HomeContact } from "../../../../types";

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
	
	// Add owners with their display info first
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
	
	// Add legacy ownerEmail/ownerPhone as a contact (only if different from owner)
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
	
	return contacts;
}

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

	// Migrate contacts if not present
	if (!home.contacts || home.contacts.length === 0) {
		home.contacts = await migrateLegacyContacts(home);
		// Save migrated contacts (clean undefined values for Firestore)
		const cleanedContacts = home.contacts.map(cleanContact);
		await db.collection("homes").doc(share.homeId).update({ contacts: cleanedContacts });
	}

	// Populate owner avatars and filter hidden contacts
	const visibleContacts: HomeContact[] = [];
	for (const contact of home.contacts) {
		if (contact.hidden) continue;
		
		if (contact.isOwner) {
			const uid = contact.id.replace("owner-", "");
			const ownerInfo = await getOwnerInfo(uid);
			contact.name = ownerInfo.displayName || contact.name;
			if (ownerInfo.photoURL) {
				contact.avatar = ownerInfo.photoURL;
			}
		}
		visibleContacts.push(contact);
	}

	return { home, share, contacts: visibleContacts };
});
