import { db } from "../useFirebaseAdmin";
import type { Home, HomeShare, GlobalSettings } from "../../types";
import crypto from "crypto";

export async function getHomes(userId: string): Promise<Home[]> {
	const snapshot = await db.collection("homes").where("ownerId", "==", userId).orderBy("name").get();
	return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Home));
}

export async function getHomeById(homeId: string): Promise<Home | null> {
	const doc = await db.collection("homes").doc(homeId).get();
	if (!doc.exists) return null;
	return { id: doc.id, ...doc.data() } as Home;
}

export async function getHomeBySlug(slug: string): Promise<Home | null> {
	const snapshot = await db.collection("homes").where("slug", "==", slug).limit(1).get();
	if (snapshot.empty) return null;
	const doc = snapshot.docs[0];
	return { id: doc.id, ...doc.data() } as Home;
}

export async function createHome(userId: string, homeData: Partial<Home>): Promise<Home> {
	const homeId = crypto.randomUUID();
	const slug = crypto.randomUUID();
	const now = new Date().toISOString();

	const home: Home = {
		id: homeId,
		name: homeData.name || "",
		slug,
		ownerId: userId,
		editors: [],
		photos: [],
		enabled: homeData.enabled ?? false,
		contact: homeData.contact || {},
		wifiPassword: homeData.wifiPassword || "",
		checkInInfo: homeData.checkInInfo || "",
		checkOutInfo: homeData.checkOutInfo || "",
		mustKnows: homeData.mustKnows || [],
		houseRules: homeData.houseRules || "",
		blanketsInfo: homeData.blanketsInfo || "",
		cleaningInfo: homeData.cleaningInfo || [],
		parkingNumber: homeData.parkingNumber || "",
		washingMachineOverride: homeData.washingMachineOverride || "",
		createdAt: now,
		updatedAt: now,
	};

	await db.collection("homes").doc(homeId).set(home);
	return home;
}

export async function updateHome(homeId: string, homeData: Partial<Home>): Promise<Home> {
	const updatedHome = {
		...homeData,
		updatedAt: new Date().toISOString(),
	};

	await db.collection("homes").doc(homeId).update(updatedHome);
	const updated = await db.collection("homes").doc(homeId).get();
	return { id: updated.id, ...updated.data() } as Home;
}

export async function deleteHome(homeId: string): Promise<void> {
	await db.collection("homes").doc(homeId).delete();
}

export async function canEditHome(homeId: string, userId: string, isAdmin: boolean): Promise<boolean> {
	if (isAdmin) return true;

	const home = await getHomeById(homeId);
	if (!home) return false;

	return home.ownerId === userId || home.editors.includes(userId);
}

export function generateShareToken(): string {
	return crypto.randomUUID();
}

export async function createShareLink(homeId: string, userId: string, daysToExpire: number = 7): Promise<HomeShare> {
	const shareId = generateShareToken();
	const now = new Date();
	const expiresAt = new Date(now);
	expiresAt.setDate(expiresAt.getDate() + Math.min(daysToExpire, 30));

	const share: HomeShare = {
		id: shareId,
		homeId,
		createdBy: userId,
		expiresAt: expiresAt.toISOString(),
		accessCount: 0,
		createdAt: now.toISOString(),
	};

	await db.collection("homeShares").doc(shareId).set(share);
	return share;
}

export async function getShareLink(shareId: string): Promise<HomeShare | null> {
	const doc = await db.collection("homeShares").doc(shareId).get();
	if (!doc.exists) return null;

	const share = { id: doc.id, ...doc.data() } as HomeShare;

	if (new Date(share.expiresAt) < new Date()) {
		return null;
	}

	return share;
}

export async function incrementShareAccess(shareId: string): Promise<void> {
	const docRef = db.collection("homeShares").doc(shareId);
	const doc = await docRef.get();
	await docRef.update({
		accessCount: (doc.data() as HomeShare).accessCount + 1,
	});
}

export async function getGlobalSettings(): Promise<GlobalSettings> {
	const doc = await db.collection("settings").doc("global").get();

	if (doc.exists) {
		return { id: doc.id, ...doc.data() } as GlobalSettings;
	}

const defaultSettings: GlobalSettings = {
			id: "global",
			maxHomeNumber: 20,
			washingMachineUse: "",
			updatedAt: new Date().toISOString(),
		};

	await db.collection("settings").doc("global").set(defaultSettings);
	return defaultSettings;
}

export async function updateGlobalSettings(settings: Partial<GlobalSettings>): Promise<GlobalSettings> {
	const updated = {
		...settings,
		updatedAt: new Date().toISOString(),
	};

	await db.collection("settings").doc("global").update(updated);
	const updatedDoc = await db.collection("settings").doc("global").get();
	return { id: updatedDoc.id, ...updatedDoc.data() } as GlobalSettings;
}

export const MAX_PHOTOS_PER_HOME = 20;