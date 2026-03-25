import { db, storage } from "../../../useFirebaseAdmin";
import { getUserClaims } from "../../../utils/auth";
import {
	buildDocumentSearchFields,
	buildDocumentSearchFieldsFromBuffer,
	canExtractDocumentText,
} from "../../../utils/documentSearch";
import { buildDocumentProcessingRecord } from "../../../utils/documentProcessing";

interface ReindexBody {
	scope?: "global" | "owner" | "all";
	limit?: number;
	homeId?: string;
}

interface ReindexCounters {
	processed: number;
	extracted: number;
	skipped: number;
	failed: number;
}

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 250;

const createCounters = (): ReindexCounters => ({
	processed: 0,
	extracted: 0,
	skipped: 0,
	failed: 0,
});

const downloadSearchBuffer = async (storagePath: string) => {
	const [buffer] = await storage.bucket().file(storagePath).download();
	return buffer;
};

export default defineEventHandler(async (event) => {
	const claims = await getUserClaims(event);
	if (!claims?.admin) {
		throw createError({ statusCode: 403, message: "Only admins can reindex documents" });
	}

	const body = await readBody(event).catch(() => ({})) as ReindexBody;
	const scope = body.scope || "all";
	const limit = Math.min(Math.max(Number(body.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
	const homeId = typeof body.homeId === "string" && body.homeId.trim() ? body.homeId.trim() : "";
	const config = useRuntimeConfig();
	const translationLanguages = (config.DOCUMENT_TRANSLATION_LANGUAGES || "fr").split(",").map((value: string) => value.trim()).filter(Boolean);
	const globalCounters = createCounters();
	const ownerCounters = createCounters();
	let remaining = limit;

	if (scope === "global" || scope === "all") {
		const snapshot = await db.collection("globalFiles").orderBy("uploadedAt", "desc").limit(limit).get();

		for (const document of snapshot.docs) {
			if (remaining <= 0) break;

			const data = document.data() as Record<string, any>;
			if (data.deletedAt) {
				globalCounters.skipped++;
				continue;
			}

			try {
				let fields = buildDocumentSearchFields({
					name: data.name,
					type: data.type,
					searchText: typeof data.searchText === "string" ? data.searchText : "",
					searchSummary: typeof data.searchSummary === "string" ? data.searchSummary : data.name,
					searchKeywords: Array.isArray(data.searchKeywords) ? data.searchKeywords : [],
				});

				if (data.storagePath && canExtractDocumentText(data.name, data.type)) {
					const buffer = await downloadSearchBuffer(data.storagePath);
					fields = buildDocumentSearchFieldsFromBuffer({
						name: data.name,
						type: data.type,
						buffer,
						searchText: typeof data.searchText === "string" ? data.searchText : "",
						searchSummary: typeof data.searchSummary === "string" ? data.searchSummary : data.name,
						searchKeywords: Array.isArray(data.searchKeywords) ? data.searchKeywords : [],
					});
				}

				const processingRecord = data.storagePath
					? await buildDocumentProcessingRecord({
						scope: "global",
						fileId: document.id,
						name: data.name,
						type: data.type,
						buffer: await downloadSearchBuffer(data.storagePath),
						searchText: typeof data.searchText === "string" ? data.searchText : "",
						searchSummary: typeof data.searchSummary === "string" ? data.searchSummary : data.name,
						searchKeywords: Array.isArray(data.searchKeywords) ? data.searchKeywords : [],
						translationLanguages,
						geminiApiKey: config.GEMINI_API_KEY,
						geminiModel: config.GEMINI_MODEL,
					})
					: null;

				await Promise.all([
					document.ref.update(fields),
					processingRecord
						? db.collection("documentProcessing").doc(processingRecord.id).set(processingRecord)
						: Promise.resolve(),
				]);
				globalCounters.processed++;
				if (fields.searchText) globalCounters.extracted++;
				remaining--;
			} catch {
				globalCounters.failed++;
			}
		}
	}

	if ((scope === "owner" || scope === "all") && remaining > 0) {
		const homesSnapshot = homeId
			? await db.collection("homes").doc(homeId).get().then((doc) => doc.exists ? [doc] : [])
			: await db.collection("homes").where("enabled", "==", true).get().then((snapshot) => snapshot.docs);

		for (const homeDocument of homesSnapshot) {
			if (remaining <= 0) break;

			const home = { id: homeDocument.id, ...homeDocument.data() } as Record<string, any>;
			const nextFiles = Array.isArray(home.files) ? [...home.files] : [];
			const nextPrivateFiles = Array.isArray(home.privateFiles) ? [...home.privateFiles] : [];
			let hasChanges = false;

			for (const collectionKey of ["files", "privateFiles"] as const) {
				const sourceFiles = collectionKey === "files" ? nextFiles : nextPrivateFiles;

				for (let index = 0; index < sourceFiles.length; index++) {
					if (remaining <= 0) break;

					const file = sourceFiles[index] as Record<string, any>;
					if (!file?.storagePath) {
						ownerCounters.skipped++;
						continue;
					}

					try {
						let fields = buildDocumentSearchFields({
							name: file.name,
							type: file.type,
							searchText: typeof file.searchText === "string" ? file.searchText : "",
							searchSummary: typeof file.searchSummary === "string" ? file.searchSummary : file.name,
							searchKeywords: Array.isArray(file.searchKeywords) ? file.searchKeywords : [],
						});

						if (canExtractDocumentText(file.name, file.type)) {
							const buffer = await downloadSearchBuffer(file.storagePath);
							fields = buildDocumentSearchFieldsFromBuffer({
								name: file.name,
								type: file.type,
								buffer,
								searchText: typeof file.searchText === "string" ? file.searchText : "",
								searchSummary: typeof file.searchSummary === "string" ? file.searchSummary : file.name,
								searchKeywords: Array.isArray(file.searchKeywords) ? file.searchKeywords : [],
							});
						}

						const processingRecord = await buildDocumentProcessingRecord({
							scope: "owner",
							fileId: file.id,
							homeId: home.id,
							visibility: file.visibility,
							name: file.name,
							type: file.type,
							buffer: await downloadSearchBuffer(file.storagePath),
							searchText: typeof file.searchText === "string" ? file.searchText : "",
							searchSummary: typeof file.searchSummary === "string" ? file.searchSummary : file.name,
							searchKeywords: Array.isArray(file.searchKeywords) ? file.searchKeywords : [],
							translationLanguages,
							geminiApiKey: config.GEMINI_API_KEY,
							geminiModel: config.GEMINI_MODEL,
						});

						sourceFiles[index] = { ...file, ...fields };
						await db.collection("documentProcessing").doc(processingRecord.id).set(processingRecord);
						hasChanges = true;
						ownerCounters.processed++;
						if (fields.searchText) ownerCounters.extracted++;
						remaining--;
					} catch {
						ownerCounters.failed++;
					}
				}
			}

			if (hasChanges) {
				await homeDocument.ref.update({
					files: nextFiles,
					privateFiles: nextPrivateFiles,
				});
			}
		}
	}

	return {
		scope,
		limit,
		global: globalCounters,
		owner: ownerCounters,
	};
});
