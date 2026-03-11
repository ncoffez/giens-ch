import { db } from "../useFirebaseAdmin";

interface OrganisatorischesContent {
	id: string;
	content: string;
	updatedAt: string;
	updatedBy: string;
}

export default defineEventHandler(async () => {
	try {
		const doc = await db.collection("settings").doc("organisatorisches").get();

		if (!doc.exists) {
			return {
				id: "organisatorisches",
				content: "",
				updatedAt: "",
				updatedBy: "",
			} as OrganisatorischesContent;
		}

		return { id: doc.id, ...doc.data() } as OrganisatorischesContent;
	} catch (e: unknown) {
		throw createError({
			statusCode: (e as any).statusCode || 500,
			message: (e as any).message || "Internal Server Error",
		});
	}
});
