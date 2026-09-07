import crypto from "crypto";
import { createError } from "h3";
import type { MemoriamEntry } from "../../types";
import { db, storage } from "../useFirebaseAdmin";
import { hasTranslatableText, translateHtml } from "./htmlTranslation";

export const MEMORIAM_COLLECTION = "memoriam";
export const MAX_MEMORIAM_PHOTOS = 8;

export interface MemoriamClaims {
	admin?: boolean;
	owner?: boolean;
	uid?: string;
}

export interface MemoriamInput {
	name?: unknown;
	bio?: unknown;
	periodFrom?: unknown;
	periodTo?: unknown;
}

const PERIOD_RE = /^(\d{4})(-\d{2}-\d{2})?$/;

export function canReadMemoriam(claims: MemoriamClaims | null | undefined): boolean {
	return !!(claims && (claims.admin || claims.owner));
}

export function canWriteMemoriam(claims: MemoriamClaims | null | undefined): boolean {
	return !!claims?.admin;
}

export function parsePeriodValue(raw: unknown): string {
	if (raw === undefined || raw === null) return "";
	if (typeof raw !== "string") {
		throw createError({
			statusCode: 400,
			message: "Period must be a year (YYYY) or date (YYYY-MM-DD)",
		});
	}

	const value = raw.trim();
	if (!value) return "";
	if (!PERIOD_RE.test(value)) {
		throw createError({
			statusCode: 400,
			message: "Period must be a year (YYYY) or date (YYYY-MM-DD)",
		});
	}

	return value;
}

export function parseMemoriamFields(body: MemoriamInput, options: { nameRequired: boolean }) {
	const name = typeof body.name === "string" ? body.name.trim() : "";

	if (options.nameRequired && !name) {
		throw createError({ statusCode: 400, message: "Name is required" });
	}

	if (name.length > 200) {
		throw createError({ statusCode: 400, message: "Name is too long" });
	}

	const periodFrom = body.periodFrom === undefined ? undefined : parsePeriodValue(body.periodFrom);
	const periodTo = body.periodTo === undefined ? undefined : parsePeriodValue(body.periodTo);
	const bio = typeof body.bio === "string" ? body.bio : undefined;

	return {
		name: name || undefined,
		bio,
		periodFrom,
		periodTo,
	};
}

export function serializeMemoriamEntry(id: string, data: Record<string, unknown> | undefined): MemoriamEntry {
	const photos = Array.isArray(data?.photos)
		? data.photos.filter((photo): photo is string => typeof photo === "string" && photo.trim().length > 0)
		: [];
	const bioByLocale = (data?.bioByLocale && typeof data.bioByLocale === "object")
		? data.bioByLocale as Record<string, unknown>
		: {};
	const bio = typeof data?.bio === "string" ? data.bio : "";
	const de = typeof bioByLocale.de === "string" ? bioByLocale.de : bio;
	const fr = typeof bioByLocale.fr === "string" ? bioByLocale.fr : "";

	return {
		id,
		name: typeof data?.name === "string" ? data.name : "",
		photos,
		bio: de,
		bioByLocale: {
			de,
			...(fr ? { fr } : {}),
		},
		periodFrom: typeof data?.periodFrom === "string" ? data.periodFrom : "",
		periodTo: typeof data?.periodTo === "string" ? data.periodTo : "",
		sortOrder: typeof data?.sortOrder === "number" && Number.isFinite(data.sortOrder) ? data.sortOrder : 0,
		createdAt: typeof data?.createdAt === "string" ? data.createdAt : "",
		updatedAt: typeof data?.updatedAt === "string" ? data.updatedAt : "",
	};
}

function periodSortKey(value: string): string {
	if (!value) return "0000-00-00";
	if (/^\d{4}$/.test(value)) return `${value}-12-31`;
	return value;
}

export function sortMemoriamEntries(entries: MemoriamEntry[]): MemoriamEntry[] {
	return [...entries].sort((a, b) => {
		if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
		const to = periodSortKey(b.periodTo).localeCompare(periodSortKey(a.periodTo));
		if (to !== 0) return to;
		const from = periodSortKey(b.periodFrom).localeCompare(periodSortKey(a.periodFrom));
		if (from !== 0) return from;
		return a.name.localeCompare(b.name, "de");
	});
}

export async function listMemoriamEntries(): Promise<MemoriamEntry[]> {
	const snapshot = await db.collection(MEMORIAM_COLLECTION).get();
	const entries = snapshot.docs.map((doc) => serializeMemoriamEntry(doc.id, doc.data() as Record<string, unknown>));
	return sortMemoriamEntries(entries);
}

export async function getMemoriamEntry(id: string): Promise<MemoriamEntry | null> {
	const doc = await db.collection(MEMORIAM_COLLECTION).doc(id).get();
	if (!doc.exists) return null;
	return serializeMemoriamEntry(doc.id, doc.data() as Record<string, unknown>);
}

export async function resolveMemoriamBio(
	germanHtml: string,
	existingFr?: string,
): Promise<{ bio: string; bioByLocale: { de: string; fr?: string } }> {
	const bioByLocale: { de: string; fr?: string } = { de: germanHtml };

	if (!hasTranslatableText(germanHtml)) {
		return { bio: germanHtml, bioByLocale };
	}

	const config = useRuntimeConfig();
	try {
		const translated = await translateHtml(germanHtml, "fr", {
			apiKey: config.GEMINI_API_KEY,
			model: config.GEMINI_MODEL,
		});
		if (translated) {
			bioByLocale.fr = translated;
			return { bio: germanHtml, bioByLocale };
		}
	} catch (error: unknown) {
		console.error("[memoriam] Could not translate bio to fr:", error);
	}

	if (existingFr) {
		bioByLocale.fr = existingFr;
	}

	return { bio: germanHtml, bioByLocale };
}

export async function createMemoriamEntry(
	input: MemoriamInput,
	uid: string,
): Promise<MemoriamEntry> {
	const parsed = parseMemoriamFields(input, { nameRequired: true });
	const now = new Date().toISOString();
	const id = crypto.randomUUID();
	const bioFields = await resolveMemoriamBio(parsed.bio ?? "");
	const existing = await listMemoriamEntries();
	const sortOrder = existing.reduce((max, entry) => Math.max(max, entry.sortOrder), -1) + 1;

	const record = {
		id,
		name: parsed.name,
		photos: [] as string[],
		...bioFields,
		periodFrom: parsed.periodFrom ?? "",
		periodTo: parsed.periodTo ?? "",
		sortOrder,
		createdAt: now,
		updatedAt: now,
		createdBy: uid,
		updatedBy: uid,
	};

	await db.collection(MEMORIAM_COLLECTION).doc(id).set(record);
	return serializeMemoriamEntry(id, record);
}

export async function updateMemoriamEntry(
	id: string,
	input: MemoriamInput,
	uid: string,
): Promise<MemoriamEntry> {
	const existing = await getMemoriamEntry(id);
	if (!existing) {
		throw createError({ statusCode: 404, message: "Memoriam entry not found" });
	}

	const parsed = parseMemoriamFields(input, { nameRequired: false });
	const updateData: Record<string, unknown> = {
		updatedAt: new Date().toISOString(),
		updatedBy: uid,
	};

	if (parsed.name !== undefined) updateData.name = parsed.name;
	if (parsed.periodFrom !== undefined) updateData.periodFrom = parsed.periodFrom;
	if (parsed.periodTo !== undefined) updateData.periodTo = parsed.periodTo;

	if (parsed.bio !== undefined) {
		Object.assign(updateData, await resolveMemoriamBio(parsed.bio, existing.bioByLocale?.fr));
	}

	await db.collection(MEMORIAM_COLLECTION).doc(id).update(updateData);
	const updated = await getMemoriamEntry(id);
	if (!updated) {
		throw createError({ statusCode: 404, message: "Memoriam entry not found" });
	}
	return updated;
}

export async function deleteMemoriamEntry(id: string): Promise<void> {
	const existing = await getMemoriamEntry(id);
	if (!existing) {
		throw createError({ statusCode: 404, message: "Memoriam entry not found" });
	}

	await db.collection(MEMORIAM_COLLECTION).doc(id).delete();

	try {
		const bucket = storage.bucket();
		const [files] = await bucket.getFiles({ prefix: `memoriam/${id}/` });
		await Promise.all(files.map((file) => file.delete().catch(() => undefined)));
	} catch (error: unknown) {
		console.error("[memoriam] Could not delete storage files:", error);
	}
}

export async function addMemoriamPhoto(
	id: string,
	fileDataUrl: string,
	contentType: string | undefined,
): Promise<{ url: string }> {
	const existing = await getMemoriamEntry(id);
	if (!existing) {
		throw createError({ statusCode: 404, message: "Memoriam entry not found" });
	}

	if (existing.photos.length >= MAX_MEMORIAM_PHOTOS) {
		throw createError({
			statusCode: 400,
			message: `Maximum ${MAX_MEMORIAM_PHOTOS} photos allowed`,
		});
	}

	const bucket = storage.bucket();
	const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
	const storagePath = `memoriam/${id}/photos/${fileName}`;
	const file = bucket.file(storagePath);
	const base64Data = fileDataUrl.split(";base64,").pop();

	if (!base64Data) {
		throw createError({ statusCode: 400, message: "File is required" });
	}

	await file.save(Buffer.from(base64Data, "base64"), {
		contentType: contentType || "image/jpeg",
	});

	const [url] = await file.getSignedUrl({
		action: "read",
		expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
	});

	await db.collection(MEMORIAM_COLLECTION).doc(id).update({
		photos: [...existing.photos, url],
		updatedAt: new Date().toISOString(),
	});

	return { url };
}

export async function reorderMemoriamEntries(ids: string[]): Promise<MemoriamEntry[]> {
	if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== "string" || !id.trim())) {
		throw createError({ statusCode: 400, message: "ids must be a list of entry IDs" });
	}

	const uniqueIds = new Set(ids);
	if (uniqueIds.size !== ids.length) {
		throw createError({ statusCode: 400, message: "ids must be unique" });
	}

	const existing = await listMemoriamEntries();
	const existingIds = new Set(existing.map((entry) => entry.id));
	if (ids.length !== existing.length || ids.some((id) => !existingIds.has(id))) {
		throw createError({ statusCode: 400, message: "ids must include every memoriam entry once" });
	}

	const now = new Date().toISOString();
	await Promise.all(ids.map((id, index) => db.collection(MEMORIAM_COLLECTION).doc(id).update({
		sortOrder: index,
		updatedAt: now,
	})));

	return listMemoriamEntries();
}

export async function removeMemoriamPhoto(id: string, photoUrl: string): Promise<void> {
	const existing = await getMemoriamEntry(id);
	if (!existing) {
		throw createError({ statusCode: 404, message: "Memoriam entry not found" });
	}

	await db.collection(MEMORIAM_COLLECTION).doc(id).update({
		photos: existing.photos.filter((url) => url !== photoUrl),
		updatedAt: new Date().toISOString(),
	});
}
