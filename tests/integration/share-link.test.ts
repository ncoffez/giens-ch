import { describe, expect, it, vi } from "vitest";
import type { Home } from "../../types";

const docs = new Map<string, Record<string, unknown>>();

vi.mock("../../server/useFirebaseAdmin", () => ({
	db: {
		collection: (name: string) => ({
			doc: (id: string) => ({
				async set(data: Record<string, unknown>) {
					docs.set(`${name}/${id}`, { ...data });
				},
				async get() {
					const data = docs.get(`${name}/${id}`);
					return {
						id,
						exists: Boolean(data),
						data: () => data,
					};
				},
			}),
		}),
	},
}));

vi.mock("firebase-admin/firestore", () => ({
	FieldValue: { increment: (n: number) => n },
}));

const { createProspectShare, createShareLink, getShareLink, isShareActive, presentHomeForShare } = await import("../../server/utils/homes");

describe("share links", () => {
	it("stores a link and returns it while it is valid", async () => {
		const share = await createShareLink("home-1", "owner-a", 7);

		expect(share.revoked).toBe(false);
		expect(share.homeId).toBe("home-1");
		await expect(getShareLink(share.id)).resolves.toMatchObject({
			id: share.id,
			homeId: "home-1",
		});
	});

	it("caps expiry at 3650 days", async () => {
		const before = Date.now();
		const share = await createShareLink("home-1", "owner-a", 99999);
		const expires = Date.parse(share.expiresAt);
		const yearMs = 365 * 24 * 60 * 60 * 1000;

		expect(expires).toBeGreaterThan(before + 9 * yearMs);
		expect(expires).toBeLessThan(before + 11 * yearMs);
	});

	it("hides revoked and expired links", async () => {
		docs.set("homeShares/revoked", {
			id: "revoked",
			homeId: "home-1",
			createdBy: "owner-a",
			expiresAt: new Date(Date.now() + 86400000).toISOString(),
			revoked: true,
			accessCount: 0,
			createdAt: new Date().toISOString(),
		});
		docs.set("homeShares/expired", {
			id: "expired",
			homeId: "home-1",
			createdBy: "owner-a",
			expiresAt: new Date(Date.now() - 1000).toISOString(),
			revoked: false,
			accessCount: 0,
			createdAt: new Date().toISOString(),
		});

		await expect(getShareLink("revoked")).resolves.toBeNull();
		await expect(getShareLink("expired")).resolves.toBeNull();
		await expect(getShareLink("missing")).resolves.toBeNull();
	});

	it("keeps a prospect link active without an expiry", async () => {
		const share = await createProspectShare("home-1", "owner-a");

		expect(share.audience).toBe("prospect");
		expect(share.expiresAt).toBe("");
		expect(isShareActive(share)).toBe(true);
		await expect(getShareLink(share.id)).resolves.toMatchObject({ audience: "prospect" });
	});

	it("shows prospects only the name and photos", () => {
		const home = {
			id: "home-1",
			name: "Haus 4",
			ownerIds: ["owner-a"],
			photos: ["/haus.jpg"],
			files: [{ id: "file-1", visibility: "shared", name: "Plan.pdf" }],
			privateFiles: [],
			folders: [],
			wifiSSID: "Beausoleil",
			wifiPassword: "geheim",
			instructions: "<p>Die Alarmanlage</p>",
			enabled: true,
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-01T00:00:00.000Z",
		};

		const prospect = presentHomeForShare(home as Home, "prospect");
		expect(prospect).toMatchObject({ name: "Haus 4", photos: ["/haus.jpg"], files: [] });
		expect(prospect.wifiPassword).toBeUndefined();
		expect(prospect.instructions).toBeUndefined();
		expect(prospect.ownerIds).toEqual([]);

		const tenant = presentHomeForShare(home as Home, "tenant");
		expect(tenant.wifiPassword).toBe("geheim");
		expect(tenant.files).toHaveLength(1);
	});
});
