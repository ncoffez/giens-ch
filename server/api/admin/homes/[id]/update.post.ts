import { db, auth } from "../../../../useFirebaseAdmin";

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

		const { enabled, ownerId, name, ...otherFields } = body;
		const previousOwnerId = (homeDoc.data() as any)?.ownerId;

		const updates: any = {
			updatedAt: new Date().toISOString(),
		};

		if (typeof enabled === "boolean") {
			updates.enabled = enabled;
		}

		if (ownerId !== undefined) {
			updates.ownerId = ownerId;

			try {
				if (ownerId !== "" && ownerId !== null) {
					const userRecord = await auth.getUser(ownerId);
					const existingClaims = userRecord.customClaims || {};

					if (!existingClaims.owner) {
						await auth.setCustomUserClaims(ownerId, {
							...existingClaims,
							owner: true
						});
					}
				}

				if (previousOwnerId && previousOwnerId !== "" && previousOwnerId !== null && previousOwnerId !== ownerId) {
					try {
						const prevUserRecord = await auth.getUser(previousOwnerId);
						const prevExistingClaims = prevUserRecord.customClaims || {};

						if (prevExistingClaims.owner) {
							const { owner, ...remainingClaims } = prevExistingClaims;
							await auth.setCustomUserClaims(previousOwnerId, remainingClaims);
						}
					} catch (prevClaimError) {
						console.error("Failed to revoke previous owner claim:", prevClaimError);
					}
				}
			} catch (claimError) {
				console.error("Failed to update owner claim:", claimError);
			}
		}

		if (name) {
			updates.name = name;
		}

		Object.assign(updates, otherFields);

		await homeRef.update(updates);

		const updated = await homeRef.get();
		return { id: updated.id, ...updated.data() };
	} catch (e: any) {
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Internal Server Error",
		});
	}
});