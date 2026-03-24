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
	updatedAt?: string;
	lastModified?: number;
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

	const getDocumentTimestamp = (document: Pick<OwnerDocument, "updatedAt" | "uploadedAt" | "lastModified">) => {
		const isoTime = Date.parse(document.updatedAt || document.uploadedAt || "");
		if (!Number.isNaN(isoTime) && isoTime > 0) return isoTime;
		if (typeof document.lastModified === "number" && Number.isFinite(document.lastModified)) return document.lastModified;
		return 0;
	};

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
				updatedAt: file.updatedAt || file.uploadedAt,
				lastModified: file.lastModified,
				uploadedBy: file.uploadedBy,
				downloadPath: `/api/homes/${home.id}/files/download?fileId=${file.id}`,
			});
		}
	}

	documents.sort((a, b) => {
		return getDocumentTimestamp(b) - getDocumentTimestamp(a);
	});

	return {
		documents,
		total: documents.length,
	};
});
