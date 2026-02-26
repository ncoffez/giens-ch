import { db, auth } from "../../../useFirebaseAdmin";
import { getUserClaims } from "../../../utils/auth";

async function syncOwnerClaims() {
	try {
		const allHomesSnapshot = await db.collection("homes").get();
		const allOwners = new Set<string>();

		allHomesSnapshot.docs.forEach((doc: any) => {
			const ownerIds = doc.data().ownerIds || [];
			ownerIds.forEach((uid: string) => allOwners.add(uid));
		});

		const allUsers = await auth.listUsers(1000);
		let grantedClaims = 0;
		let revokedClaims = 0;

		for (const user of allUsers.users) {
			const claims = user.customClaims || {};
			const isClaimed = claims.owner;
			const shouldBeOwner = allOwners.has(user.uid);

			if (shouldBeOwner && !isClaimed) {
				try {
					await auth.setCustomUserClaims(user.uid, { ...claims, owner: true });
					grantedClaims++;
				} catch (e: unknown) {
					throw new Error(`Failed to grant owner claim to ${user.uid}: ${e}`);
				}
			} else if (!shouldBeOwner && isClaimed) {
				try {
					const { owner, ...remainingClaims } = claims;
					await auth.setCustomUserClaims(user.uid, remainingClaims);
					revokedClaims++;
				} catch (e: unknown) {
					throw new Error(`Failed to revoke owner claim from ${user.uid}: ${e}`);
				}
			}
		}

		return { grantedClaims, revokedClaims };
	} catch (error) {
		console.error("Error syncing owner claims:", error);
		throw error;
	}
}

export default defineEventHandler(async (event) => {
	try {
		const claims = await getUserClaims(event);

		if (!claims || !claims.admin) {
			throw createError({ statusCode: 403, message: "Forbidden: Admin access required" });
		}

		const homesSnapshot = await db.collection("homes").get();
		let migratedHomes = 0;
		const errors: string[] = [];

		for (const doc of homesSnapshot.docs) {
			const homeData = doc.data();
			const ownerId = homeData.ownerId;
			const ownerIds = homeData.ownerIds;

			if (ownerId !== undefined && !ownerIds) {
				try {
					const newOwnerIds = ownerId ? [ownerId] : [];
					await db.collection("homes").doc(doc.id).update({
						ownerIds: newOwnerIds,
						ownerId: ""
					});
					migratedHomes++;
				} catch (e: unknown) {
					errors.push(`Failed to migrate home ${doc.id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
				}
			} else if (ownerId !== undefined && ownerId !== undefined) {
				try {
					await db.collection("homes").doc(doc.id).update({
						ownerId: ""
					});
				} catch (e: unknown) {
					errors.push(`Failed to remove ownerId from home ${doc.id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
				}
			}
		}

		const { grantedClaims, revokedClaims } = await syncOwnerClaims();

		return {
			status: "success",
			migratedHomes,
			grantedClaims,
			revokedClaims,
			errors: errors.length > 0 ? errors : undefined
		};
	} catch (e: unknown) {
		throw createError({
			statusCode: (e as { statusCode?: number }).statusCode || 500,
			message: e instanceof Error ? e.message : "Internal Server Error",
		});
	}
});