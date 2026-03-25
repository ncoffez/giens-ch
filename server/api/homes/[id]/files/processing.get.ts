import { db } from "../../../../useFirebaseAdmin";
import { getUserClaims } from "../../../../utils/auth";
import { getHomeById, isHomeOwner } from "../../../../utils/homes";
import { buildDocumentProcessingId } from "../../../../utils/documentProcessing";

export default defineEventHandler(async (event) => {
	const homeId = getRouterParam(event, "id");
	const fileId = getQuery(event).fileId as string | undefined;

	if (!homeId || !fileId) {
		throw createError({ statusCode: 400, message: "Home ID and file ID are required" });
	}

	const claims = await getUserClaims(event);
	if (!claims) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const isAdmin = !!claims.admin;
	const owner = await isHomeOwner(homeId, claims.uid);
	if (!isAdmin && !owner) {
		throw createError({ statusCode: 403, message: "Forbidden" });
	}

	const home = await getHomeById(homeId);
	if (!home) {
		throw createError({ statusCode: 404, message: "Home not found" });
	}

	const isPrivate = getQuery(event).private === "true";
	const file = (isPrivate ? (home.privateFiles || []) : (home.files || [])).find((entry) => entry.id === fileId);
	if (!file?.storagePath) {
		throw createError({ statusCode: 404, message: "File not found" });
	}

	const locale = ((getQuery(event).locale as string) || "de").trim();
	const processingId = buildDocumentProcessingId("owner", fileId, homeId);
	const document = await db.collection("documentProcessing").doc(processingId).get();

	if (!document.exists) {
		return { processing: null, locale };
	}

	const processing = document.data() as Record<string, any>;
	const localized = locale !== "de" ? processing.translations?.[locale] : null;

	return {
		locale,
		processing: {
			...processing,
			localizedText: localized?.searchText || "",
			localizedSummary: localized?.searchSummary || "",
		},
	};
});
