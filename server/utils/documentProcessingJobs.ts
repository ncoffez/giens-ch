import { db, storage } from "../useFirebaseAdmin";
import {
	buildDocumentProcessingId,
	buildDocumentProcessingRecord,
	type DocumentProcessingRecord,
} from "./documentProcessing";

/**
 * OCR and translation run after the upload has answered (issue #39).
 *
 * The upload route writes a `pending` job into `documentProcessing`. The client
 * then calls the process route, which runs the job inside its own HTTP request,
 * so Cloud Run keeps CPU for it (a promise left running after a response would
 * be throttled). A job that never ran or got cut off is picked up again from
 * the documents preview or the admin reindex.
 */

export type DocumentProcessingStatus = "pending" | "processing" | "done" | "failed";

/**
 * A job still "processing" after this long was cut off and may be claimed again.
 * Must stay well above the server function timeout (timeoutSeconds: 300 in
 * nuxt.config.ts), otherwise a job that is still running could be started twice.
 */
export const PROCESSING_STALE_MS = 10 * 60 * 1000;
export const MAX_PROCESSING_ATTEMPTS = 3;

export interface PendingDocumentProcessingInput {
	scope: "global" | "owner";
	fileId: string;
	homeId?: string;
	visibility?: "shared" | "private";
	name: string;
	type: string;
	storagePath: string;
	searchText?: string;
	searchSummary?: string;
	searchKeywords?: string[];
	requestedSearch?: {
		searchText?: string;
		searchSummary?: string;
		searchKeywords?: string[];
	};
}

export interface DocumentProcessingJob extends Partial<DocumentProcessingRecord> {
	id: string;
	scope: "global" | "owner";
	fileId: string;
	name: string;
	type: string;
	storagePath?: string;
	status?: DocumentProcessingStatus;
	queuedAt?: string;
	startedAt?: string;
	finishedAt?: string;
	attempts?: number;
	error?: string | null;
	requestedSearch?: PendingDocumentProcessingInput["requestedSearch"];
}

export interface ProcessDocumentJobOptions {
	geminiApiKey?: string;
	geminiModel?: string;
	translationLanguages?: string[];
	/** Allow a failed job to run again (user pressed "retry"). */
	retry?: boolean;
	now?: () => number;
	log?: (line: string) => void;
}

export interface ProcessDocumentJobResult {
	status: DocumentProcessingStatus | "skipped" | "missing";
	error?: string;
}

const COLLECTION = "documentProcessing";

const withoutUndefined = <T extends Record<string, unknown>>(value: T): T => {
	return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
};

export function buildPendingDocumentProcessingRecord(
	input: PendingDocumentProcessingInput,
	now: Date = new Date(),
): DocumentProcessingJob {
	return withoutUndefined({
		id: buildDocumentProcessingId(input.scope, input.fileId, input.homeId),
		scope: input.scope,
		fileId: input.fileId,
		homeId: input.homeId,
		visibility: input.visibility,
		name: input.name,
		type: input.type,
		storagePath: input.storagePath,
		searchText: input.searchText || "",
		searchSummary: input.searchSummary || input.name,
		searchKeywords: input.searchKeywords || [],
		searchUpdatedAt: now.toISOString(),
		extractionSource: "metadata" as const,
		ocrApplied: false,
		translationLanguages: [],
		requestedSearch: input.requestedSearch ? withoutUndefined({ ...input.requestedSearch }) : undefined,
		status: "pending" as const,
		queuedAt: now.toISOString(),
		attempts: 0,
		error: null,
	});
}

export function canClaimDocumentProcessingJob(
	job: Pick<DocumentProcessingJob, "status" | "startedAt" | "attempts"> | null | undefined,
	options: { now: number; retry?: boolean },
): boolean {
	if (!job) return false;
	// Records written before #39 have no status and are already processed.
	const status = job.status || "done";

	if (status === "pending") return true;
	if (status === "processing") {
		const startedAt = job.startedAt ? Date.parse(job.startedAt) : 0;
		return !startedAt || options.now - startedAt > PROCESSING_STALE_MS;
	}
	if (status === "failed") {
		return Boolean(options.retry) && (job.attempts || 0) < MAX_PROCESSING_ATTEMPTS;
	}
	return false;
}

export function isDocumentProcessingStale(
	job: Pick<DocumentProcessingJob, "status" | "queuedAt" | "startedAt"> | null | undefined,
	now: number,
	pendingGraceMs = 2 * 60 * 1000,
): boolean {
	if (!job) return false;
	if (job.status === "pending") {
		const queuedAt = job.queuedAt ? Date.parse(job.queuedAt) : 0;
		return !queuedAt || now - queuedAt > pendingGraceMs;
	}
	if (job.status === "processing") {
		const startedAt = job.startedAt ? Date.parse(job.startedAt) : 0;
		return !startedAt || now - startedAt > PROCESSING_STALE_MS;
	}
	return false;
}

const claimJob = async (processingId: string, options: { now: number; retry?: boolean }) => {
	const ref = db.collection(COLLECTION).doc(processingId);

	return await db.runTransaction(async (transaction: any) => {
		const snapshot = await transaction.get(ref);
		if (!snapshot.exists) return { job: null, missing: true };

		const job = { id: processingId, ...snapshot.data() } as DocumentProcessingJob;
		if (!canClaimDocumentProcessingJob(job, options)) return { job: null, missing: false, current: job };

		const startedAt = new Date(options.now).toISOString();
		const attempts = (job.attempts || 0) + 1;
		transaction.set(ref, { status: "processing", startedAt, attempts }, { merge: true });
		return { job: { ...job, status: "processing" as const, startedAt, attempts }, missing: false };
	});
};

const errorMessage = (error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	// Never let an API key that ended up in an error text reach Firestore or the UI.
	return message.replace(/key=[^&\s"]+/gi, "key=***").slice(0, 500);
};

export async function processDocumentJob(
	processingId: string,
	options: ProcessDocumentJobOptions = {},
): Promise<ProcessDocumentJobResult> {
	const now = options.now || (() => Date.now());
	const write = options.log || ((line: string) => console.log(line));
	const startedAt = now();
	const claim = await claimJob(processingId, { now: startedAt, retry: options.retry });

	if (claim.missing) return { status: "missing" };
	if (!claim.job) return { status: claim.current?.status || "skipped" };

	const job = claim.job;
	const ref = db.collection(COLLECTION).doc(processingId);
	const logResult = (status: DocumentProcessingStatus, extra: Record<string, unknown> = {}) => {
		try {
			write(JSON.stringify({
				severity: status === "failed" ? "WARNING" : "INFO",
				message: `document processing ${status}`,
				event: "document.processing",
				processingId,
				scope: job.scope,
				contentType: job.type,
				status,
				attempts: job.attempts,
				processingMs: Math.round(now() - startedAt),
				...extra,
			}));
		} catch {
			// Logging must never break processing.
		}
	};

	try {
		if (!job.storagePath) {
			throw new Error("Processing job has no storagePath");
		}

		const downloadStartedAt = now();
		const [buffer] = await storage.bucket().file(job.storagePath).download();
		const downloadMs = Math.round(now() - downloadStartedAt);

		const record = await buildDocumentProcessingRecord({
			scope: job.scope,
			fileId: job.fileId,
			homeId: job.homeId,
			visibility: job.visibility,
			name: job.name,
			type: job.type,
			buffer,
			searchText: job.requestedSearch?.searchText || "",
			searchSummary: job.requestedSearch?.searchSummary || job.name,
			searchKeywords: job.requestedSearch?.searchKeywords || [],
			translationLanguages: options.translationLanguages || [],
			geminiApiKey: options.geminiApiKey,
			geminiModel: options.geminiModel,
		});

		// Name and visibility may have changed (rename/move) while the job ran;
		// those routes own the fields, so the result must not overwrite them.
		const { id: _id, name: _name, visibility: _visibility, homeId: _homeId, ...result } = record;
		await ref.set(withoutUndefined({
			...result,
			translations: result.translations || {},
			status: "done",
			finishedAt: new Date(now()).toISOString(),
			error: null,
		}), { merge: true });

		logResult("done", { fileSize: buffer.length, downloadMs, extractionSource: record.extractionSource });
		return { status: "done" };
	} catch (error) {
		const message = errorMessage(error);
		await ref.set({
			status: "failed",
			error: message,
			finishedAt: new Date(now()).toISOString(),
		}, { merge: true }).catch(() => undefined);

		logResult("failed", { error: message });
		return { status: "failed", error: message };
	}
}

export const parseTranslationLanguages = (value: string | undefined) => {
	return (value || "fr").split(",").map((entry) => entry.trim()).filter(Boolean);
};
