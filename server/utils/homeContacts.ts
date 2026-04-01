import type { Home, HomeContact } from "../../types";
import { auth, db } from "../useFirebaseAdmin";

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

export function cleanContact(contact: HomeContact): Record<string, unknown> {
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

export async function syncHomeContacts(home: Home): Promise<HomeContact[]> {
	const existingContacts = home.contacts || [];
	const existingOwnerContacts = new Map(
		existingContacts.filter(contact => contact.isOwner).map(contact => [contact.id, contact]),
	);
	const nextContacts: HomeContact[] = [];

	for (const uid of home.ownerIds || []) {
		const contactId = `owner-${uid}`;
		const existing = existingOwnerContacts.get(contactId);
		const ownerInfo = await getOwnerInfo(uid);

		nextContacts.push({
			id: contactId,
			name: ownerInfo.displayName || existing?.name || "Eigentümer",
			hidden: existing?.hidden ?? false,
			isOwner: true,
			email: existing?.email,
			phone: existing?.phone,
			notes: existing?.notes,
			avatar: ownerInfo.photoURL || existing?.avatar,
		});
	}

	const hasLegacyContact = existingContacts.some(contact => contact.id === "legacy-contact");
	if (hasLegacyContact) {
		const legacyContact = existingContacts.find(contact => contact.id === "legacy-contact");
		if (legacyContact) {
			nextContacts.push(legacyContact);
		}
	} else if (existingContacts.length === 0 && (home.ownerEmail || home.ownerPhone)) {
		nextContacts.push({
			id: "legacy-contact",
			name: "Kontakt",
			email: home.ownerEmail || undefined,
			phone: home.ownerPhone || undefined,
			hidden: false,
			isOwner: false,
		});
	}

	for (const contact of existingContacts) {
		if (!contact.isOwner && contact.id !== "legacy-contact") {
			nextContacts.push(contact);
		}
	}

	return nextContacts;
}
