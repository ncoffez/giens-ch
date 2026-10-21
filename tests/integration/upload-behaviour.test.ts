import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRuntimeConfig } from "#app/nuxt";
import {
	fakeHooks,
	fakeStorageState,
	readDoc,
	resetFakeFirebase,
	seedDoc,
} from "../helpers/fakeFirebaseAdmin";

/**
 * Behaviour tests for issue #39 (slow uploads).
 *
 * Gemini and Firebase are replaced by in-memory fakes, so these tests are fast
 * and deterministic. They assert causes (is Gemini awaited before the upload
 * answers? do concurrent uploads lose records?) rather than wall-clock times.
 *
 * The "target behaviour (#39)" block started as `it.fails` in the test PR and
 * was flipped to `it` together with the implementation.
 */

vi.mock("../../server/useFirebaseAdmin", async () => (await import("../helpers/fakeFirebaseAdmin")).fakeFirebaseAdmin);

const claims = { uid: "owner-1", owner: true };

vi.mock("../../server/utils/auth", () => ({
	getUserClaims: vi.fn(async () => claims),
	requireSignedIn: vi.fn(async () => claims),
}));

vi.mock("../../server/utils/permissionAccess", async () => {
	const { readDoc: read } = await import("../helpers/fakeFirebaseAdmin");
	return {
		assertDocumentAction: vi.fn(async () => undefined),
		requireAreaPermission: vi.fn(async () => claims),
		requireAnyAreaPermission: vi.fn(async () => claims),
		assertHomeSection: vi.fn(async (_event: unknown, homeId: string) => ({
			claims,
			home: { id: homeId, ...read("homes", homeId) },
		})),
	};
});

vi.mock("../../server/utils/htmlTranslation", () => ({
	hasTranslatableText: () => false,
	translateHtml: vi.fn(async (html: string) => html),
}));

interface FakeEvent {
	body?: Record<string, unknown>;
	params?: Record<string, string>;
	query?: Record<string, string>;
}

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("readBody", async (event: FakeEvent) => JSON.parse(JSON.stringify(event.body ?? {})));
vi.stubGlobal("getRouterParam", (event: FakeEvent, name: string) => event.params?.[name]);
vi.stubGlobal("getQuery", (event: FakeEvent) => event.query ?? {});

type Handler = (event: FakeEvent) => Promise<any>;

const loadHandler = async (path: string): Promise<Handler> => (await import(/* @vite-ignore */ path)).default as Handler;

/** Loads a module that only exists once the #39 implementation landed. */
const importTarget = async <T = any>(path: string): Promise<T> => await import(/* @vite-ignore */ path) as T;

const originalFetch = globalThis.fetch;

const geminiResponse = (text: string) => ({
	ok: true,
	status: 200,
	statusText: "OK",
	json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
	text: async () => text,
});

const geminiFailure = () => ({
	ok: false,
	status: 503,
	statusText: "Service Unavailable",
	json: async () => ({}),
	text: async () => "overloaded",
});

let geminiFetch: ReturnType<typeof vi.fn>;

const useGemini = (impl: () => unknown) => {
	geminiFetch = vi.fn(async (url: string) => {
		if (!String(url).includes("generativelanguage.googleapis.com")) {
			throw new Error(`Unexpected fetch in test: ${url}`);
		}
		return impl();
	});
	vi.stubGlobal("fetch", geminiFetch);
};

const pdfDataUrl = (content = "%PDF-1.4 test") => `data:application/pdf;base64,${Buffer.from(content).toString("base64")}`;
const jpegDataUrl = (content = "jpeg-bytes") => `data:image/jpeg;base64,${Buffer.from(content).toString("base64")}`;

const timingLines = (spy: ReturnType<typeof vi.spyOn>) => spy.mock.calls
	.map((call) => String(call[0]))
	.filter((line) => line.startsWith("{"))
	.map((line) => JSON.parse(line))
	.filter((entry) => entry.event === "upload.timing");

let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	resetFakeFirebase();
	Object.assign(useRuntimeConfig(), {
		GEMINI_API_KEY: "test-gemini-key",
		GEMINI_MODEL: "gemini-test",
		DOCUMENT_TRANSLATION_LANGUAGES: "fr",
	});
	useGemini(() => geminiResponse("Erkannter Text aus dem PDF"));
	logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
	vi.spyOn(console, "warn").mockImplementation(() => undefined);
	vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
	vi.stubGlobal("fetch", originalFetch);
	vi.restoreAllMocks();
});

const uploadGlobal = async (body: Record<string, unknown> = {}) => {
	const handler = await loadHandler("../../server/api/files/upload.post.ts");
	return handler({
		body: {
			file: pdfDataUrl(),
			name: "Protokoll.pdf",
			type: "application/pdf",
			size: 13,
			folderId: "folder-1",
			...body,
		},
	});
};

const uploadHomeFile = async (name: string) => {
	const handler = await loadHandler("../../server/api/homes/[id]/files/upload.post.ts");
	return handler({
		params: { id: "home-1" },
		body: { file: pdfDataUrl(name), name, type: "application/pdf", size: 13 },
	});
};

const seedHome = () => seedDoc("homes", "home-1", {
	name: "Haus 1",
	ownerIds: ["owner-1"],
	files: [],
	privateFiles: [],
	photos: [],
	enabled: true,
});

describe("upload timing logs", () => {
	it("measures each phase with the injected clock and writes one JSON line", async () => {
		const { createUploadTimer } = await import("../../server/utils/uploadTiming");
		let now = 1000;
		const lines: string[] = [];
		const timer = createUploadTimer("/api/test/upload", { clock: () => now, log: (line) => lines.push(line) });

		timer.set({ fileSize: 2048, contentType: "application/pdf" });
		await timer.measure("storage", async () => { now += 120; });
		await timer.measure("processing", async () => { now += 3000; });
		await timer.measure("firestore", async () => { now += 40; });
		now += 5;
		const entry = timer.finish("ok");
		timer.finish("ok");

		expect(lines).toHaveLength(1);
		expect(JSON.parse(lines[0]!)).toEqual(entry);
		expect(entry).toMatchObject({
			severity: "INFO",
			event: "upload.timing",
			route: "/api/test/upload",
			status: "ok",
			fileSize: 2048,
			contentType: "application/pdf",
			storageMs: 120,
			processingMs: 3000,
			firestoreMs: 40,
			totalMs: 3165,
		});
	});

	it("logs failed uploads with their status code", async () => {
		const { withUploadTiming } = await import("../../server/utils/uploadTiming");
		const lines: string[] = [];
		const handler = withUploadTiming("/api/test/upload", async () => {
			throw Object.assign(new Error("too large"), { statusCode: 413 });
		}, { clock: () => 0, log: (line) => lines.push(line) });

		await expect(handler({} as any)).rejects.toThrow("too large");
		expect(JSON.parse(lines[0]!)).toMatchObject({ status: "error", statusCode: 413, severity: "WARNING" });
	});

	it("logs one timing line per global document upload", async () => {
		await uploadGlobal();

		const entries = timingLines(logSpy);
		expect(entries).toHaveLength(1);
		expect(entries[0]).toMatchObject({
			route: "/api/files/upload",
			status: "ok",
			fileSize: 13,
			contentType: "application/pdf",
		});
		for (const key of ["storageMs", "processingMs", "firestoreMs", "totalMs"]) {
			expect(typeof entries[0][key]).toBe("number");
		}
	});

	it.each([
		"server/api/files/upload.post.ts",
		"server/api/homes/[id]/files/upload.post.ts",
		"server/api/homes/[id]/photos/upload.post.ts",
		"server/api/admin/memoriam/[id]/photos/upload.post.ts",
		"server/api/editor/upload.post.ts",
	])("wraps %s in withUploadTiming", (file) => {
		expect(readFileSync(file, "utf8")).toContain("withUploadTiming(");
	});
});

describe("document upload: behaviour that must stay", () => {
	it("stores the file and returns the Firestore record", async () => {
		const record = await uploadGlobal();

		expect(record).toMatchObject({ name: "Protokoll.pdf", type: "application/pdf", folderId: "folder-1", uploadedBy: "owner-1" });
		expect(String(record.storagePath)).toMatch(/^global-files\//);
		expect(fakeStorageState.get(record.storagePath)?.buffer.toString()).toBe("%PDF-1.4 test");
		expect(readDoc("globalFiles", record.id)).toMatchObject({ name: "Protokoll.pdf" });
	});

	it("rejects a request without file data", async () => {
		await expect(uploadGlobal({ file: "" })).rejects.toMatchObject({ statusCode: 400 });
	});

	it("rejects files over the size limit before touching Storage", async () => {
		await expect(uploadGlobal({ size: 60 * 1024 * 1024 })).rejects.toMatchObject({ statusCode: 400 });
		expect(fakeStorageState.size).toBe(0);
	});

	it("adds a single house file to the home", async () => {
		seedHome();
		await uploadHomeFile("Plan.pdf");

		expect(readDoc("homes", "home-1")?.files.map((file: any) => file.name)).toEqual(["Plan.pdf"]);
	});

	it("adds a single house photo to the home", async () => {
		seedHome();
		const handler = await loadHandler("../../server/api/homes/[id]/photos/upload.post.ts");
		await handler({ params: { id: "home-1" }, body: { file: jpegDataUrl(), type: "image/jpeg" } });

		expect(readDoc("homes", "home-1")?.photos).toHaveLength(1);
	});
});

describe("document upload: behaviour after #39", () => {
	it("answers before any Gemini call (global documents)", async () => {
		await uploadGlobal();
		expect(geminiFetch).not.toHaveBeenCalled();
	});

	it("answers before any Gemini call (house files)", async () => {
		seedHome();
		await uploadHomeFile("Plan.pdf");
		expect(geminiFetch).not.toHaveBeenCalled();
	});

	it("leaves a pending processing job behind the upload", async () => {
		const record = await uploadGlobal();
		expect(readDoc("documentProcessing", `global:${record.id}`)).toMatchObject({
			status: "pending",
			fileId: record.id,
			storagePath: record.storagePath,
		});
	});

	it("still succeeds when Gemini is down, and keeps the file", async () => {
		useGemini(() => geminiFailure());
		const record = await uploadGlobal();

		expect(readDoc("globalFiles", record.id)).toBeDefined();
		expect(fakeStorageState.has(record.storagePath)).toBe(true);
	});

	it("runs OCR and translation afterwards and marks the job done", async () => {
		const { processDocumentJob } = await importTarget("/server/utils/documentProcessingJobs.ts");
		const record = await uploadGlobal();
		expect(geminiFetch).not.toHaveBeenCalled();

		const result = await processDocumentJob(`global:${record.id}`, {
			geminiApiKey: "test-gemini-key",
			geminiModel: "gemini-test",
			translationLanguages: ["fr"],
		});

		expect(result.status).toBe("done");
		expect(geminiFetch).toHaveBeenCalled();
		const processing = readDoc("documentProcessing", `global:${record.id}`);
		expect(processing).toMatchObject({ status: "done", extractionSource: "gemini" });
		expect(processing?.searchText).toContain("Erkannter Text");
		expect(processing?.translations?.fr?.searchText).toBeTruthy();
	});

	it("marks the job failed when Gemini fails, without orphaning the file", async () => {
		const { processDocumentJob } = await importTarget("/server/utils/documentProcessingJobs.ts");
		const record = await uploadGlobal();
		useGemini(() => geminiFailure());

		const result = await processDocumentJob(`global:${record.id}`, { geminiApiKey: "test-gemini-key", translationLanguages: ["fr"] });

		expect(result.status).toBe("failed");
		expect(readDoc("documentProcessing", `global:${record.id}`)).toMatchObject({ status: "failed" });
		expect(readDoc("documentProcessing", `global:${record.id}`)?.error).toContain("503");
		expect(readDoc("globalFiles", record.id)).toBeDefined();
		expect(fakeStorageState.has(record.storagePath)).toBe(true);
	});

	it("keeps a rename that happened while the job was pending", async () => {
		const { processDocumentJob } = await importTarget("/server/utils/documentProcessingJobs.ts");
		const record = await uploadGlobal();
		seedDoc("documentProcessing", `global:${record.id}`, {
			...readDoc("documentProcessing", `global:${record.id}`),
			name: "Umbenannt.pdf",
		});

		await processDocumentJob(`global:${record.id}`, { geminiApiKey: "test-gemini-key", translationLanguages: [] });

		expect(readDoc("documentProcessing", `global:${record.id}`)?.name).toBe("Umbenannt.pdf");
	});

	it("keeps every house file when several upload at the same time", async () => {
		seedHome();
		await Promise.all(["A.pdf", "B.pdf", "C.pdf"].map((name) => uploadHomeFile(name)));

		const names = readDoc("homes", "home-1")?.files.map((file: any) => file.name).sort();
		expect(names).toEqual(["A.pdf", "B.pdf", "C.pdf"]);
	});

	it("keeps every house photo when several upload at the same time", async () => {
		seedHome();
		const handler = await loadHandler("../../server/api/homes/[id]/photos/upload.post.ts");
		await Promise.all([1, 2, 3].map((index) => handler({
			params: { id: "home-1" },
			body: { file: jpegDataUrl(`photo-${index}`), type: "image/jpeg" },
		})));

		expect(readDoc("homes", "home-1")?.photos).toHaveLength(3);
	});

	it("keeps every In Memoriam photo when several upload at the same time", async () => {
		seedDoc("memoriam", "entry-1", { name: "Anna", bio: "", photos: [], order: 0, createdAt: "2026-01-01", updatedAt: "2026-01-01" });
		const handler = await loadHandler("../../server/api/admin/memoriam/[id]/photos/upload.post.ts");
		await Promise.all([1, 2, 3].map((index) => handler({
			params: { id: "entry-1" },
			body: { file: jpegDataUrl(`photo-${index}`), type: "image/jpeg" },
		})));

		expect(readDoc("memoriam", "entry-1")?.photos).toHaveLength(3);
	});
	it("rejects files over the real request limit", async () => {
		await expect(uploadGlobal({ size: 30 * 1024 * 1024 })).rejects.toMatchObject({ statusCode: 400 });
		expect(fakeStorageState.size).toBe(0);
	});

	it("runs the job through the process route and reports the result", async () => {
		const record = await uploadGlobal();
		const handler = await loadHandler("../../server/api/files/process.post.ts");

		await expect(handler({ body: { fileId: record.id } })).resolves.toEqual({ status: "done" });
		// A second call does not run Gemini again.
		const calls = geminiFetch.mock.calls.length;
		await expect(handler({ body: { fileId: record.id } })).resolves.toEqual({ status: "done" });
		expect(geminiFetch.mock.calls.length).toBe(calls);
	});

	it("answers 404 from the process route for an unknown file", async () => {
		const handler = await loadHandler("../../server/api/files/process.post.ts");
		await expect(handler({ body: { fileId: "missing" } })).rejects.toMatchObject({ statusCode: 404 });
	});

	it("runs house file jobs through the house process route", async () => {
		seedHome();
		const record = await uploadHomeFile("Plan.pdf");
		const handler = await loadHandler("../../server/api/homes/[id]/files/process.post.ts");

		await expect(handler({ params: { id: "home-1" }, body: { fileId: record.id } })).resolves.toEqual({ status: "done" });
		expect(readDoc("documentProcessing", `owner:home-1:${record.id}`)).toMatchObject({ status: "done", homeId: "home-1", visibility: "shared" });
	});

	it("retries a failed job only when asked, and at most three times", async () => {
		const { processDocumentJob } = await importTarget("/server/utils/documentProcessingJobs.ts");
		const record = await uploadGlobal();
		const id = `global:${record.id}`;
		useGemini(() => geminiFailure());

		await processDocumentJob(id, { geminiApiKey: "k", translationLanguages: [] });
		await expect(processDocumentJob(id, { geminiApiKey: "k", translationLanguages: [] })).resolves.toEqual({ status: "failed" });
		expect(readDoc("documentProcessing", id)?.attempts).toBe(1);

		await processDocumentJob(id, { geminiApiKey: "k", translationLanguages: [], retry: true });
		await processDocumentJob(id, { geminiApiKey: "k", translationLanguages: [], retry: true });
		await processDocumentJob(id, { geminiApiKey: "k", translationLanguages: [], retry: true });
		expect(readDoc("documentProcessing", id)?.attempts).toBe(3);

		useGemini(() => geminiResponse("Jetzt klappt es"));
		await processDocumentJob(id, { geminiApiKey: "k", translationLanguages: [], retry: true });
		expect(readDoc("documentProcessing", id)?.status).toBe("failed");
	});

	it("takes over a job that got cut off while processing", async () => {
		const { canClaimDocumentProcessingJob, isDocumentProcessingStale, PROCESSING_STALE_MS } = await importTarget("/server/utils/documentProcessingJobs.ts");
		const now = Date.parse("2026-10-21T10:00:00.000Z");
		const recent = new Date(now - 60_000).toISOString();
		const old = new Date(now - PROCESSING_STALE_MS - 1).toISOString();

		expect(canClaimDocumentProcessingJob({ status: "pending" }, { now })).toBe(true);
		expect(canClaimDocumentProcessingJob({ status: "processing", startedAt: recent }, { now })).toBe(false);
		expect(canClaimDocumentProcessingJob({ status: "processing", startedAt: old }, { now })).toBe(true);
		expect(canClaimDocumentProcessingJob({ status: "done" }, { now, retry: true })).toBe(false);
		// Records from before #39 have no status: they are already processed.
		expect(canClaimDocumentProcessingJob({}, { now })).toBe(false);

		expect(isDocumentProcessingStale({ status: "pending", queuedAt: recent }, now)).toBe(false);
		expect(isDocumentProcessingStale({ status: "pending", queuedAt: new Date(now - 3 * 60_000).toISOString() }, now)).toBe(true);
		expect(isDocumentProcessingStale({ status: "done" }, now)).toBe(false);
	});

	it("logs a structured line for each processing run", async () => {
		const { processDocumentJob } = await importTarget("/server/utils/documentProcessingJobs.ts");
		const record = await uploadGlobal();
		const lines: string[] = [];

		await processDocumentJob(`global:${record.id}`, { geminiApiKey: "k", translationLanguages: ["fr"], log: (line: string) => lines.push(line) });

		expect(lines).toHaveLength(1);
		expect(JSON.parse(lines[0]!)).toMatchObject({ event: "document.processing", status: "done", scope: "global", fileSize: 13 });
	});

	it("rejects a house photo over the limit of 30 even when uploads race", async () => {
		seedDoc("homes", "home-1", { name: "Haus 1", ownerIds: ["owner-1"], photos: Array.from({ length: 29 }, (_, i) => `p${i}`), enabled: true });
		const handler = await loadHandler("../../server/api/homes/[id]/photos/upload.post.ts");
		const results = await Promise.allSettled([1, 2].map((index) => handler({
			params: { id: "home-1" },
			body: { file: jpegDataUrl(`photo-${index}`), type: "image/jpeg" },
		})));

		expect(results.map((result) => result.status).sort()).toEqual(["fulfilled", "rejected"]);
		expect(readDoc("homes", "home-1")?.photos).toHaveLength(30);
		// The rejected photo does not stay behind in Storage.
		expect([...fakeStorageState.keys()].filter((key) => key.startsWith("homes/home-1/photos/"))).toHaveLength(1);
	});
});

describe("processing timeouts stay consistent", () => {
	it("keeps the stale threshold above the server function timeout", async () => {
		const { PROCESSING_STALE_MS } = await importTarget("/server/utils/documentProcessingJobs.ts");
		const config = readFileSync("nuxt.config.ts", "utf8");
		const timeoutSeconds = Number(config.match(/timeoutSeconds:\s*(\d+)/)?.[1]);

		expect(timeoutSeconds).toBe(300);
		expect(PROCESSING_STALE_MS).toBeGreaterThan(timeoutSeconds * 1000);
	});

	it("polls the preview longer than a run and than the stale threshold", () => {
		const page = readFileSync("app/pages/documents/index.vue", "utf8");
		const pollMs = Number(page.match(/PROCESSING_POLL_MS = (\d+)/)?.[1]);
		const pollLimit = Number(page.match(/PROCESSING_POLL_LIMIT = (\d+)/)?.[1]);

		expect(pollMs * pollLimit).toBeGreaterThan(10 * 60 * 1000);
		expect(page).toContain("PROCESSING_STALE_MS = 10 * 60 * 1000");
	});
});
