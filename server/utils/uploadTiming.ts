import type { H3Event } from "h3";

export type UploadTimingPhase = "storage" | "processing" | "firestore";

export interface UploadTimingDetails {
	fileSize?: number;
	contentType?: string;
	[key: string]: unknown;
}

export interface UploadTimingEntry extends UploadTimingDetails {
	severity: "INFO" | "WARNING";
	message: string;
	event: "upload.timing";
	route: string;
	status: "ok" | "error";
	statusCode?: number;
	storageMs: number;
	processingMs: number;
	firestoreMs: number;
	totalMs: number;
}

export interface UploadTimer {
	measure<T>(phase: UploadTimingPhase, task: () => Promise<T>): Promise<T>;
	set(details: UploadTimingDetails): void;
	finish(status: "ok" | "error", error?: unknown): UploadTimingEntry;
}

export interface UploadTimerOptions {
	clock?: () => number;
	log?: (line: string) => void;
}

const getStatusCode = (error: unknown) => {
	if (typeof error !== "object" || error === null) return undefined;
	const statusCode = (error as Record<string, unknown>).statusCode;
	return typeof statusCode === "number" ? statusCode : undefined;
};

/**
 * Measures one upload request and writes a single structured JSON line.
 * Cloud Functions gen 2 turns JSON on stdout into a structured Cloud Logging
 * entry, so `jsonPayload.event="upload.timing"` filters every upload and the
 * phase durations can be compared before and after a change (issue #39).
 */
export function createUploadTimer(route: string, options: UploadTimerOptions = {}): UploadTimer {
	const clock = options.clock || (() => performance.now());
	const write = options.log || ((line: string) => console.log(line));
	const startedAt = clock();
	const phases: Record<UploadTimingPhase, number> = {
		storage: 0,
		processing: 0,
		firestore: 0,
	};
	const details: UploadTimingDetails = {};
	let finished: UploadTimingEntry | null = null;

	return {
		async measure<T>(phase: UploadTimingPhase, task: () => Promise<T>): Promise<T> {
			const phaseStartedAt = clock();
			try {
				return await task();
			} finally {
				phases[phase] += clock() - phaseStartedAt;
			}
		},
		set(nextDetails: UploadTimingDetails) {
			Object.assign(details, nextDetails);
		},
		finish(status: "ok" | "error", error?: unknown) {
			if (finished) return finished;

			const statusCode = status === "error" ? getStatusCode(error) || 500 : undefined;
			finished = {
				severity: status === "error" ? "WARNING" : "INFO",
				message: `upload ${status} ${route}`,
				event: "upload.timing",
				route,
				status,
				...(statusCode ? { statusCode } : {}),
				...details,
				storageMs: Math.round(phases.storage),
				processingMs: Math.round(phases.processing),
				firestoreMs: Math.round(phases.firestore),
				totalMs: Math.round(clock() - startedAt),
			};

			try {
				write(JSON.stringify(finished));
			} catch {
				// Logging must never break an upload.
			}

			return finished;
		},
	};
}

/**
 * Wraps an upload route so every request, successful or not, ends with one
 * timing log line. The handler receives the timer to measure its phases.
 */
export function withUploadTiming<T>(
	route: string,
	handler: (event: H3Event, timer: UploadTimer) => Promise<T>,
	options: UploadTimerOptions = {},
) {
	return async (event: H3Event): Promise<T> => {
		const timer = createUploadTimer(route, options);
		try {
			const result = await handler(event, timer);
			timer.finish("ok");
			return result;
		} catch (error) {
			timer.finish("error", error);
			throw error;
		}
	};
}
