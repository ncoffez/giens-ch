import { db } from "../useFirebaseAdmin";
import type { Home, HomeShare, HomeShareAudience } from "../../types";
import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { canManageHomeFiles } from "./fileAccess";

export async function getHomesForUser(userId: string): Promise<Home[]> {
	const snapshot = await db
		.collection("homes")
		.where("ownerIds", "array-contains", userId)
		.where("enabled", "==", true)
		.orderBy("name")
		.get();

	return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Home));
}

export async function getHomeById(homeId: string): Promise<Home | null> {
	const doc = await db.collection("homes").doc(homeId).get();
	if (!doc.exists) return null;
	return { id: doc.id, ...doc.data() } as Home;
}

export async function createHome(name: string, ownerIds: string[] = []): Promise<Home> {
	const homeId = crypto.randomUUID();
	const now = new Date().toISOString();
	const normalizedOwnerIds = ownerIds.filter((ownerId) => typeof ownerId === "string" && ownerId.trim().length > 0);

	const home: Home = {
		id: homeId,
		name,
		ownerIds: normalizedOwnerIds,
		photos: [],
		files: [],
		privateFiles: [],
		folders: [],
		enabled: true,
		createdAt: now,
		updatedAt: now,
	};

	await db.collection("homes").doc(homeId).set(home);
	return home;
}

export async function updateHome(homeId: string, data: Partial<Home>): Promise<Home> {
	const updateData = {
		...data,
		updatedAt: new Date().toISOString(),
	};

	await db.collection("homes").doc(homeId).update(updateData);
	const updated = await db.collection("homes").doc(homeId).get();
	return { id: updated.id, ...updated.data() } as Home;
}

export async function deleteHome(homeId: string): Promise<void> {
	await db.collection("homes").doc(homeId).delete();
}

export async function isHomeOwner(homeId: string, userId: string): Promise<boolean> {
	const home = await getHomeById(homeId);
	return canManageHomeFiles({ uid: userId }, home);
}

export function shareAudience(share: Pick<HomeShare, "audience">): HomeShareAudience {
	return share.audience === "prospect" ? "prospect" : "tenant";
}

/** A prospect link never expires. Older links without an audience stay tenant links. */
export function isShareActive(share: HomeShare, now = new Date()): boolean {
	if (share.revoked) return false;
	if (shareAudience(share) === "prospect") return true;
	if (!share.expiresAt) return false;
	return new Date(share.expiresAt) > now;
}

/**
 * What a share link may reveal. Prospects get the name and photos only.
 * Stay details (WLAN, instructions, contacts, files) stay on tenant links.
 */
export function presentHomeForShare(home: Home, audience: HomeShareAudience): Home {
	if (audience === "prospect") {
		return {
			id: home.id,
			name: home.name,
			ownerIds: [],
			photos: home.photos || [],
			files: [],
			privateFiles: [],
			folders: [],
			enabled: home.enabled,
			createdAt: home.createdAt,
			updatedAt: home.updatedAt,
		};
	}

	return {
		...home,
		files: (home.files || []).filter((file) => file.visibility !== "private"),
		privateFiles: [],
	};
}

export async function createShareLink(
	homeId: string,
	userId: string,
	daysToExpire: number = 7,
	audience: HomeShareAudience = "tenant",
): Promise<HomeShare> {
	const shareId = crypto.randomUUID();
	const now = new Date();
	const expiresAt = new Date(now);
	expiresAt.setDate(expiresAt.getDate() + Math.min(daysToExpire, 3650));

	const share: HomeShare = {
		id: shareId,
		homeId,
		createdBy: userId,
		audience,
		expiresAt: audience === "prospect" ? "" : expiresAt.toISOString(),
		revoked: false,
		accessCount: 0,
		createdAt: now.toISOString(),
	};

	await db.collection("homeShares").doc(shareId).set(share);
	return share;
}

export async function createProspectShare(homeId: string, userId: string): Promise<HomeShare> {
	return createShareLink(homeId, userId, 0, "prospect");
}

export async function ensureProspectShare(homeId: string, userId: string): Promise<HomeShare> {
	const shares = await getShareLinksForHome(homeId);
	const existing = shares.find((share) => share.audience === "prospect" && !share.revoked);
	if (existing) return existing;
	return createProspectShare(homeId, userId);
}

export async function renewProspectShare(homeId: string, userId: string): Promise<HomeShare> {
	const shares = await getShareLinksForHome(homeId);
	await Promise.all(shares
		.filter((share) => share.audience === "prospect" && !share.revoked)
		.map((share) => revokeShareLink(share.id)));
	return createProspectShare(homeId, userId);
}

export async function getShareLink(shareId: string): Promise<HomeShare | null> {
	const doc = await db.collection("homeShares").doc(shareId).get();
	if (!doc.exists) return null;

	const share = { id: doc.id, ...doc.data() } as HomeShare;

	if (!isShareActive(share)) return null;

	return share;
}

export async function getShareLinksForHome(homeId: string): Promise<HomeShare[]> {
	const snapshot = await db
		.collection("homeShares")
		.where("homeId", "==", homeId)
		.orderBy("createdAt", "desc")
		.get();

	return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as HomeShare));
}

export async function revokeShareLink(shareId: string): Promise<void> {
	await db.collection("homeShares").doc(shareId).update({ revoked: true });
}

export async function incrementShareAccess(shareId: string): Promise<void> {
	await db.collection("homeShares").doc(shareId).set({
		accessCount: FieldValue.increment(1),
	}, { merge: true });
}

export interface GlobalSettingsPatch {
	maxHomeNumber?: number;
	washingMachineUse?: string;
	homesFeatureGloballyEnabled?: boolean;
}

export function pickGlobalSettingsPatch(body: unknown): GlobalSettingsPatch {
	if (!body || typeof body !== "object") return {};

	const input = body as Record<string, unknown>;
	const patch: GlobalSettingsPatch = {};

	if (input.maxHomeNumber !== undefined) {
		patch.maxHomeNumber = input.maxHomeNumber as number;
	}
	if (input.washingMachineUse !== undefined) {
		patch.washingMachineUse = input.washingMachineUse as string;
	}
	if (input.homesFeatureGloballyEnabled !== undefined) {
		patch.homesFeatureGloballyEnabled = input.homesFeatureGloballyEnabled as boolean;
	}

	return patch;
}

export async function getGlobalSettings(): Promise<{
	id: string;
	maxHomeNumber: number;
	washingMachineUse: string;
	homesFeatureGloballyEnabled: boolean;
	updatedAt: string;
}> {
	const doc = await db.collection("settings").doc("global").get();

	if (doc.exists) {
		const data = doc.data() || {};
		return {
			id: doc.id,
			maxHomeNumber: typeof data.maxHomeNumber === "number" ? data.maxHomeNumber : 20,
			washingMachineUse: typeof data.washingMachineUse === "string" ? data.washingMachineUse : "",
			homesFeatureGloballyEnabled: data.homesFeatureGloballyEnabled === true,
			updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : "",
		};
	}

	const defaultSettings = {
		id: "global",
		maxHomeNumber: 20,
		washingMachineUse: "",
		homesFeatureGloballyEnabled: false,
		updatedAt: new Date().toISOString(),
	};

	await db.collection("settings").doc("global").set(defaultSettings);
	return defaultSettings;
}

export async function updateGlobalSettings(settings: GlobalSettingsPatch): Promise<{
	id: string;
	maxHomeNumber: number;
	washingMachineUse: string;
	homesFeatureGloballyEnabled: boolean;
	updatedAt: string;
}> {
	const patch = pickGlobalSettingsPatch(settings);
	await db.collection("settings").doc("global").set({
		...patch,
		updatedAt: new Date().toISOString(),
	}, { merge: true });
	return getGlobalSettings();
}
