import { MAX_UPLOAD_BYTES } from "#shared/uploadLimits";

export { MAX_UPLOAD_BYTES, MAX_EDITOR_UPLOAD_BYTES, formatUploadLimit } from "#shared/uploadLimits";

/** How many files go up at the same time. Small on purpose: the server function is small. */
export const UPLOAD_CONCURRENCY = 3;

/**
 * Runs `worker` for every item with at most `limit` running at once. A slot is
 * refilled as soon as one finishes (not per batch), and one failure never stops
 * the others. Results keep the input order, like Promise.allSettled.
 */
export async function runWithConcurrency<T, R>(
	items: readonly T[],
	limit: number,
	worker: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
	const results: PromiseSettledResult<R>[] = new Array(items.length);
	let nextIndex = 0;

	const runNext = async (): Promise<void> => {
		while (nextIndex < items.length) {
			const index = nextIndex++;
			try {
				results[index] = { status: "fulfilled", value: await worker(items[index] as T, index) };
			} catch (reason) {
				results[index] = { status: "rejected", reason };
			}
		}
	};

	const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, () => runNext());
	await Promise.all(workers);
	return results;
}

export interface ByteProgress {
	/** `fraction` of file `index` has been sent (0..1). */
	update(index: number, fraction: number): void;
	/** The server answered for file `index` (success or failure). */
	complete(index: number): void;
	loadedBytes(): number;
	totalBytes(): number;
	/** 0..100, weighted by file size. Stays below 100 until every file has an answer. */
	percent(): number;
}

/** Aggregates per-file upload progress into one bar weighted by bytes. */
export function createByteProgress(sizes: readonly number[]): ByteProgress {
	const weights = sizes.map((size) => Math.max(1, size || 0));
	const total = weights.reduce((sum, size) => sum + size, 0);
	const fractions = weights.map(() => 0);
	const done = weights.map(() => false);

	const loaded = () => weights.reduce((sum, size, index) => sum + size * (done[index] ? 1 : fractions[index]!), 0);

	return {
		update(index, fraction) {
			if (index < 0 || index >= weights.length || done[index]) return;
			fractions[index] = Math.min(1, Math.max(fractions[index]!, fraction || 0));
		},
		complete(index) {
			if (index < 0 || index >= weights.length) return;
			done[index] = true;
			fractions[index] = 1;
		},
		loadedBytes: () => Math.round(loaded()),
		totalBytes: () => total,
		percent() {
			if (!total) return 0;
			const value = Math.round((loaded() / total) * 100);
			return done.every(Boolean) ? 100 : Math.min(99, value);
		},
	};
}

export interface UploadRequestError extends Error {
	statusCode: number;
	status: number;
	data: unknown;
}

export interface UploadJsonOptions {
	headers?: Record<string, string>;
	/** Fraction (0..1) of the request body sent so far. */
	onProgress?: (fraction: number) => void;
	signal?: AbortSignal;
}

const parseJson = (text: string) => {
	if (!text) return null;
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
};

const createRequestError = (status: number, data: unknown, fallback: string): UploadRequestError => {
	const message = typeof data === "object" && data !== null && typeof (data as Record<string, unknown>).message === "string"
		? String((data as Record<string, unknown>).message)
		: fallback;
	return Object.assign(new Error(message), { statusCode: status, status, data }) as UploadRequestError;
};

/**
 * POSTs JSON with XMLHttpRequest, because fetch() cannot report upload
 * progress. Resolves with the parsed JSON body; rejects with an error shaped
 * like an ofetch error (`statusCode`, `data.message`), so `getFetchError`
 * keeps showing the server's message.
 */
export function uploadJsonWithProgress<T = unknown>(
	url: string,
	body: unknown,
	options: UploadJsonOptions = {},
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", url);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.setRequestHeader("Accept", "application/json");
		for (const [name, value] of Object.entries(options.headers || {})) {
			if (value) xhr.setRequestHeader(name, value);
		}

		if (xhr.upload) {
			xhr.upload.onprogress = (event: ProgressEvent) => {
				if (!event.lengthComputable || !event.total) return;
				options.onProgress?.(Math.min(1, event.loaded / event.total));
			};
		}

		xhr.onload = () => {
			const data = parseJson(xhr.responseText);
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve(data as T);
				return;
			}
			reject(createRequestError(xhr.status, data, `Upload failed (${xhr.status})`));
		};
		xhr.onerror = () => reject(createRequestError(0, null, "Netzwerkfehler beim Hochladen"));
		xhr.onabort = () => reject(createRequestError(0, null, "Upload abgebrochen"));

		if (options.signal) {
			if (options.signal.aborted) {
				xhr.abort();
				return;
			}
			options.signal.addEventListener("abort", () => xhr.abort(), { once: true });
		}

		xhr.send(JSON.stringify(body));
	});
}

export const readFileAsDataUrl = (file: Blob) => new Promise<string>((resolve, reject) => {
	const reader = new FileReader();
	reader.onload = () => resolve(reader.result as string);
	reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
	reader.readAsDataURL(file);
});

export function findOversizedFiles<T extends { size: number }>(files: readonly T[], maxBytes = MAX_UPLOAD_BYTES): T[] {
	return files.filter((file) => file.size > maxBytes);
}

export const formatMegabytes = (bytes: number) => {
	const value = bytes / (1024 * 1024);
	return `${value >= 10 ? Math.round(value) : value.toFixed(1)} MB`;
};

let processingChain: Promise<unknown> = Promise.resolve();

/**
 * Document processing (OCR, translation) runs one request at a time per tab,
 * so a big multi-upload does not occupy every server instance at once.
 */
export function enqueueDocumentProcessing(task: () => Promise<unknown>): Promise<unknown> {
	const next = processingChain.then(task, task);
	processingChain = next.catch(() => undefined);
	return next;
}
