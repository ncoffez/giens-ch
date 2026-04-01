import { db, auth } from "../../../../useFirebaseAdmin";
import { cleanContact, syncHomeContacts } from "../../../../utils/homeContacts";

async function syncOwnerClaims() {
	try {
		const allHomes = await db.collection("homes").get();
		const allOwners = new Set<string>();

		allHomes.docs.forEach(doc => {
			const ownerIds = doc.data().ownerIds || [];
			ownerIds.forEach((id: string) => allOwners.add(id));
		});

		const allUsers = await auth.listUsers(1000);
		allUsers.users.forEach(user => {
			const claims = user.customClaims || {};
			const isClaimed = claims.owner;
			const shouldBeOwner = allOwners.has(user.uid);

			if (shouldBeOwner && !isClaimed) {
				auth.setCustomUserClaims(user.uid, { ...claims, owner: true }).catch(e => {
					console.error(`Failed to grant owner claim to ${user.uid}:`, e);
				});
			} else if (!shouldBeOwner && isClaimed) {
				const { owner, ...remainingClaims } = claims;
				auth.setCustomUserClaims(user.uid, remainingClaims).catch(e => {
					console.error(`Failed to revoke owner claim from ${user.uid}:`, e);
				});
			}
		});
	} catch (error) {
		console.error("Error syncing owner claims:", error);
	}
}

async function grantOwnerClaim(uid: string) {
	try {
		const userRecord = await auth.getUser(uid);
		const existingClaims = userRecord.customClaims || {};

		if (!existingClaims.owner) {
			await auth.setCustomUserClaims(uid, {
				...existingClaims,
				owner: true
			});
		}
	} catch (error) {
		console.error(`Failed to grant owner claim to ${uid}:`, error);
	}
}

async function revokeOwnerClaimIfNoHomes(uid: string) {
	try {
		const homesSnapshot = await db.collection("homes")
			.where("ownerIds", "array-contains", uid)
			.get();

		if (homesSnapshot.empty) {
			const userRecord = await auth.getUser(uid);
			const existingClaims = userRecord.customClaims || {};

			if (existingClaims.owner) {
				const { owner, ...remainingClaims } = existingClaims;
				await auth.setCustomUserClaims(uid, remainingClaims);
			}
		}
	} catch (error) {
		console.error(`Failed to revoke owner claim from ${uid}:`, error);
	}
}

export default defineEventHandler(async (event) => {
	try {
		const claims = await getUserClaims(event);

		if (!claims || !claims.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Admin access required" });
		}

		const homeId = getRouterParam(event, "id");
		const body = await readBody(event);

		if (!homeId) {
			throw createError({ statusCode: 400, message: "Home ID is required" });
		}

		const homeRef = db.collection("homes").doc(homeId);
		const homeDoc = await homeRef.get();

		if (!homeDoc.exists) {
			throw createError({ statusCode: 404, message: "Home not found" });
		}

		const { enabled, ownerIds, name, ...otherFields } = body;
		const previousOwnerIds = (homeDoc.data() as any)?.ownerIds || [];
		const newOwnerIds = ownerIds || [];

		const updates: any = {
			updatedAt: new Date().toISOString(),
		};

		if (typeof enabled === "boolean") {
			updates.enabled = enabled;
		}

		if (ownerIds !== undefined) {
			updates.ownerIds = newOwnerIds;

			const addedOwners = newOwnerIds.filter((id: string) => !previousOwnerIds.includes(id));
			const removedOwners = previousOwnerIds.filter((id: string) => !newOwnerIds.includes(id));

			for (const uid of addedOwners) {
				if (uid && uid !== "") {
					await grantOwnerClaim(uid);
				}
			}

			for (const uid of removedOwners) {
				if (uid && uid !== "") {
					await revokeOwnerClaimIfNoHomes(uid);
				}
			}
		}

		if (name) {
			updates.name = name;
		}

		Object.assign(updates, otherFields);

		await homeRef.update(updates);

		if (ownerIds !== undefined) {
			const refreshedDoc = await homeRef.get();
			const refreshedHome = { id: refreshedDoc.id, ...refreshedDoc.data() } as any;
			const syncedContacts = await syncHomeContacts(refreshedHome);
			await homeRef.update({
				contacts: syncedContacts.map(cleanContact),
				updatedAt: new Date().toISOString(),
			});
		}

		await syncOwnerClaims();

		const updated = await homeRef.get();
		return { id: updated.id, ...updated.data() };
	} catch (e: unknown) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});
