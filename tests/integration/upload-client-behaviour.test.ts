import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Client-side upload behaviour for issue #39: multi-upload with a concurrency
 * limit, byte-based progress, and photo downscaling before upload.
 *
 * The "target behaviour" blocks started as `it.fails` in the test PR and were
 * flipped together with app/utils/uploadQueue.ts and app/utils/imageResize.ts.
 */

const importTarget = async <T = any>(path: string): Promise<T> => await import(/* @vite-ignore */ path) as T;

const deferred = <T = void>() => {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
};

const source = (file: string) => readFileSync(file, "utf8");

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const UPLOAD_UIS = {
	documents: "app/pages/documents/index.vue",
	houseFiles: "app/components/homes/HomeFiles.vue",
	housePhotos: "app/components/homes/HomePhotos.vue",
	memoriamPhotos: "app/pages/admin/memoriam.vue",
	editorAttachments: "app/components/tiptap/editor.vue",
};

describe("multi-upload: behaviour that must stay", () => {
	it.each([
		UPLOAD_UIS.documents,
		UPLOAD_UIS.houseFiles,
		UPLOAD_UIS.housePhotos,
		UPLOAD_UIS.memoriamPhotos,
	])("lets the user pick several files in %s", (file) => {
		expect(source(file)).toMatch(/type="file"[^>]*\bmultiple\b|\bmultiple\b[^>]*type="file"|type="file"\s*\n(?:\s+[^\n]*\n)*?\s+multiple/);
	});

	it("keeps the profile picture a single-file upload", () => {
		const modal = source("app/components/ui/ProfilePictureModal.vue");
		const input = modal.slice(modal.indexOf("type=\"file\"") - 200, modal.indexOf("type=\"file\"") + 300);
		expect(input).not.toMatch(/\bmultiple\b/);
	});
});

describe("multi-upload: behaviour after #39", () => {
	it("lets the user pick several editor attachments at once", () => {
		expect(source(UPLOAD_UIS.editorAttachments)).toMatch(/type="file"[^>]*\bmultiple\b/);
	});

	it("runs at most `limit` uploads at the same time and finishes all of them", async () => {
		const { runWithConcurrency } = await importTarget("/app/utils/uploadQueue.ts");
		let inFlight = 0;
		let maxInFlight = 0;
		const gates = Array.from({ length: 7 }, () => deferred());

		const run = runWithConcurrency([0, 1, 2, 3, 4, 5, 6], 3, async (index: number) => {
			inFlight++;
			maxInFlight = Math.max(maxInFlight, inFlight);
			await gates[index]!.promise;
			inFlight--;
			if (index === 2) throw new Error("upload 2 failed");
			return `done-${index}`;
		});

		for (const gate of gates) {
			await Promise.resolve();
			await Promise.resolve();
			gate.resolve();
		}
		const results = await run;

		expect(maxInFlight).toBe(3);
		expect(results.map((result: any) => result.status)).toEqual([
			"fulfilled", "fulfilled", "rejected", "fulfilled", "fulfilled", "fulfilled", "fulfilled",
		]);
		expect(results[6]).toMatchObject({ status: "fulfilled", value: "done-6" });
	});

	it("starts the next upload as soon as one slot is free, not per batch", async () => {
		const { runWithConcurrency } = await importTarget("/app/utils/uploadQueue.ts");
		const started: number[] = [];
		const gates = Array.from({ length: 4 }, () => deferred());

		const run = runWithConcurrency([0, 1, 2, 3], 3, async (index: number) => {
			started.push(index);
			await gates[index]!.promise;
		});

		await Promise.resolve();
		expect(started).toEqual([0, 1, 2]);
		gates[1]!.resolve();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(started).toEqual([0, 1, 2, 3]);

		gates.forEach((gate) => gate.resolve());
		await run;
	});

	it("weights the progress bar by bytes, not by file count", async () => {
		const { createByteProgress } = await importTarget("/app/utils/uploadQueue.ts");
		const progress = createByteProgress([9_000_000, 1_000_000]);

		expect(progress.percent()).toBe(0);
		progress.update(0, 0.5);
		expect(progress.percent()).toBe(45);
		progress.complete(1);
		expect(progress.percent()).toBe(55);
		expect(progress.loadedBytes()).toBe(5_500_000);
		expect(progress.totalBytes()).toBe(10_000_000);
	});

	it("moves through intermediate values for a single file", async () => {
		const { createByteProgress } = await importTarget("/app/utils/uploadQueue.ts");
		const progress = createByteProgress([4_000_000]);

		progress.update(0, 0.25);
		expect(progress.percent()).toBe(25);
		progress.update(0, 1);
		// Fully sent but the server has not answered yet: not 100% until complete().
		expect(progress.percent()).toBeLessThan(100);
		progress.complete(0);
		expect(progress.percent()).toBe(100);
	});

	it("reports real upload progress from XMLHttpRequest", async () => {
		const { uploadJsonWithProgress } = await importTarget("/app/utils/uploadQueue.ts");
		const instances: any[] = [];

		class FakeXhr {
			upload: { onprogress: ((event: any) => void) | null } = { onprogress: null };
			onload: (() => void) | null = null;
			onerror: (() => void) | null = null;
			onabort: (() => void) | null = null;
			status = 0;
			responseText = "";
			headers: Record<string, string> = {};
			method = "";
			url = "";
			body: unknown = null;
			constructor() { instances.push(this); }
			open(method: string, url: string) { this.method = method; this.url = url; }
			setRequestHeader(name: string, value: string) { this.headers[name] = value; }
			send(body: unknown) { this.body = body; }
			abort() { this.onabort?.(); }
		}
		vi.stubGlobal("XMLHttpRequest", FakeXhr);

		const fractions: number[] = [];
		const request = uploadJsonWithProgress("/api/files/upload", { name: "a.pdf" }, {
			headers: { Authorization: "Bearer token" },
			onProgress: (fraction: number) => fractions.push(fraction),
		});

		const xhr = instances[0];
		expect(xhr.method).toBe("POST");
		expect(xhr.headers.Authorization).toBe("Bearer token");
		expect(JSON.parse(xhr.body)).toEqual({ name: "a.pdf" });

		xhr.upload.onprogress({ lengthComputable: true, loaded: 50, total: 200 });
		xhr.upload.onprogress({ lengthComputable: true, loaded: 200, total: 200 });
		xhr.status = 200;
		xhr.responseText = JSON.stringify({ id: "file-1" });
		xhr.onload();

		await expect(request).resolves.toEqual({ id: "file-1" });
		expect(fractions).toEqual([0.25, 1]);
	});

	it("rejects with the server message so existing error toasts keep working", async () => {
		const { uploadJsonWithProgress } = await importTarget("/app/utils/uploadQueue.ts");
		class FakeXhr {
			upload = { onprogress: null };
			onload: (() => void) | null = null;
			status = 0;
			responseText = "";
			open() {}
			setRequestHeader() {}
			send() {
				this.status = 413;
				this.responseText = JSON.stringify({ statusCode: 413, message: "Datei zu gross" });
				queueMicrotask(() => this.onload?.());
			}
		}
		vi.stubGlobal("XMLHttpRequest", FakeXhr);

		await expect(uploadJsonWithProgress("/api/files/upload", {}, {})).rejects.toMatchObject({
			statusCode: 413,
			data: { message: "Datei zu gross" },
		});
	});

	it("rejects files over the real request limit before uploading", async () => {
		const { MAX_UPLOAD_BYTES, findOversizedFiles } = await importTarget("/app/utils/uploadQueue.ts");
		const small = { name: "a.pdf", size: 1024 };
		const big = { name: "b.pdf", size: 30 * 1024 * 1024 };

		// Base64 over the server adds a third; Cloud Run caps a request at 32 MiB.
		expect(MAX_UPLOAD_BYTES).toBeLessThanOrEqual(24 * 1024 * 1024);
		expect(findOversizedFiles([small, big])).toEqual([big]);
	});

	it.each(Object.entries(UPLOAD_UIS))("%s uploads with byte progress and a concurrency limit", (_name, file) => {
		const content = source(file);
		expect(content).toContain("uploadJsonWithProgress");
		expect(content).toContain("runWithConcurrency");
	});
});

describe("photo downscaling: behaviour after #39", () => {
	it("scales the long edge down to 2560 px and keeps the aspect ratio", async () => {
		const { getResizedDimensions } = await importTarget("/app/utils/imageResize.ts");

		expect(getResizedDimensions(6000, 4000, 2560)).toEqual({ width: 2560, height: 1707 });
		expect(getResizedDimensions(3000, 4500, 2560)).toEqual({ width: 1707, height: 2560 });
		expect(getResizedDimensions(1600, 1200, 2560)).toEqual({ width: 1600, height: 1200 });
	});

	it("only touches formats the browser can re-encode", async () => {
		const { shouldResizeImage } = await importTarget("/app/utils/imageResize.ts");

		expect(shouldResizeImage({ type: "image/jpeg" })).toBe(true);
		expect(shouldResizeImage({ type: "image/png" })).toBe(true);
		expect(shouldResizeImage({ type: "image/webp" })).toBe(true);
		expect(shouldResizeImage({ type: "image/gif" })).toBe(false);
		expect(shouldResizeImage({ type: "image/heic" })).toBe(false);
		expect(shouldResizeImage({ type: "image/svg+xml" })).toBe(false);
		expect(shouldResizeImage({ type: "application/pdf" })).toBe(false);
	});

	it("downscales a large photo before upload", async () => {
		const { resizeImageForUpload } = await importTarget("/app/utils/imageResize.ts");
		const drawImage = vi.fn();
		vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 6000, height: 4000, close: vi.fn() })));
		vi.stubGlobal("OffscreenCanvas", class {
			constructor(public width: number, public height: number) {}
			getContext() { return { drawImage, imageSmoothingQuality: "low" }; }
			async convertToBlob(options: { type: string; quality: number }) {
				return new Blob([new Uint8Array(500_000)], { type: options.type });
			}
		});

		const original = new File([new Uint8Array(8_000_000)], "Terrasse.jpg", { type: "image/jpeg", lastModified: 1700000000000 });
		const resized = await resizeImageForUpload(original);

		expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 2560, 1707);
		expect(resized).not.toBe(original);
		expect(resized.name).toBe("Terrasse.jpg");
		expect(resized.type).toBe("image/jpeg");
		expect(resized.size).toBeLessThan(original.size);
		expect(resized.lastModified).toBe(original.lastModified);
	});

	it("leaves small photos, GIFs and documents untouched", async () => {
		const { resizeImageForUpload } = await importTarget("/app/utils/imageResize.ts");
		vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 1200, height: 800, close: vi.fn() })));

		const small = new File([new Uint8Array(300_000)], "klein.jpg", { type: "image/jpeg" });
		const gif = new File([new Uint8Array(10)], "anim.gif", { type: "image/gif" });
		const pdf = new File([new Uint8Array(10)], "plan.pdf", { type: "application/pdf" });

		expect(await resizeImageForUpload(small)).toBe(small);
		expect(await resizeImageForUpload(gif)).toBe(gif);
		expect(await resizeImageForUpload(pdf)).toBe(pdf);
	});

	it("falls back to the original when the browser cannot decode the image", async () => {
		const { resizeImageForUpload } = await importTarget("/app/utils/imageResize.ts");
		vi.stubGlobal("createImageBitmap", vi.fn(async () => { throw new Error("decode failed"); }));

		const photo = new File([new Uint8Array(5_000_000)], "kaputt.jpg", { type: "image/jpeg" });
		expect(await resizeImageForUpload(photo)).toBe(photo);
	});

	it.each([
		UPLOAD_UIS.housePhotos,
		UPLOAD_UIS.memoriamPhotos,
		UPLOAD_UIS.editorAttachments,
	])("%s downscales photos before upload", (file) => {
		expect(source(file)).toContain("resizeImageForUpload");
	});
});
