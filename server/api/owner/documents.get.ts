import { getUserClaims } from "../../utils/auth";
import { getHomesForUser } from "../../utils/homes";

interface OwnerDocument {
	id: string;
	homeId: string;
	homeName: string;
	name: string;
	type: string;
	size: number;
	uploadedAt: string;
	uploadedBy: string;
	downloadPath: string;
}

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	if (!claims.owner && !claims.admin) {
		throw createError({ statusCode: 403, message: "Forbidden" });
	}

	const homes = await getHomesForUser(claims.uid);
	const documents: OwnerDocument[] = [];

	for (const home of homes) {
		for (const file of home.files || []) {
			if (!file.storagePath) continue;

			documents.push({
				id: file.id,
				homeId: home.id,
				homeName: home.name,
				name: file.name,
				type: file.type,
				size: file.size,
				uploadedAt: file.uploadedAt,
				uploadedBy: file.uploadedBy,
				downloadPath: `/api/homes/${home.id}/files/download?fileId=${file.id}`,
			});
		}
	}

	documents.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

	return {
		documents,
		total: documents.length,
	};
});
