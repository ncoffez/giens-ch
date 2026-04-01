import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const getUserDocMock = vi.fn();

vi.mock("../../server/useFirebaseAdmin", () => ({
	auth: {
		getUser: getUserMock,
	},
	db: {
		collection: vi.fn(() => ({
			doc: vi.fn(() => ({
				get: getUserDocMock,
			})),
		})),
	},
}));

describe("syncHomeContacts", () => {
	beforeEach(() => {
		getUserMock.mockReset();
		getUserDocMock.mockReset();

		getUserMock.mockImplementation(async (uid: string) => ({
			displayName: uid === "owner-2" ? "Zweiter Owner" : "Erster Owner",
			photoURL: uid === "owner-2" ? "https://example.com/owner-2.jpg" : null,
		}));

		getUserDocMock.mockImplementation(async () => ({
			exists: false,
			data: () => null,
		}));
	});

	it("adds missing owner contacts while preserving additional contacts", async () => {
		const { syncHomeContacts } = await import("../../server/utils/homeContacts");

		const contacts = await syncHomeContacts({
			id: "home-1",
			name: "Haus 1",
			ownerIds: ["owner-1", "owner-2"],
			photos: [],
			files: [],
			privateFiles: [],
			folders: [],
			enabled: true,
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-01T00:00:00.000Z",
			contacts: [
				{
					id: "owner-owner-1",
					name: "Alter Name",
					hidden: true,
					isOwner: true,
				},
				{
					id: "contact-1",
					name: "Hauswart",
					hidden: false,
					isOwner: false,
					phone: "+41 79 000 00 00",
				},
			],
		});

		expect(contacts).toEqual([
			expect.objectContaining({
				id: "owner-owner-1",
				name: "Erster Owner",
				hidden: true,
				isOwner: true,
			}),
			expect.objectContaining({
				id: "owner-owner-2",
				name: "Zweiter Owner",
				hidden: false,
				isOwner: true,
				avatar: "https://example.com/owner-2.jpg",
			}),
			expect.objectContaining({
				id: "contact-1",
				name: "Hauswart",
				isOwner: false,
			}),
		]);
	});

	it("removes owner contacts for owners that are no longer assigned", async () => {
		const { syncHomeContacts } = await import("../../server/utils/homeContacts");

		const contacts = await syncHomeContacts({
			id: "home-1",
			name: "Haus 1",
			ownerIds: ["owner-2"],
			photos: [],
			files: [],
			privateFiles: [],
			folders: [],
			enabled: true,
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-01T00:00:00.000Z",
			contacts: [
				{
					id: "owner-owner-1",
					name: "Erster Owner",
					hidden: false,
					isOwner: true,
				},
				{
					id: "owner-owner-2",
					name: "Zweiter Owner",
					hidden: false,
					isOwner: true,
				},
			],
		});

		expect(contacts).toHaveLength(1);
		expect(contacts[0]).toEqual(expect.objectContaining({
			id: "owner-owner-2",
			name: "Zweiter Owner",
		}));
	});

	it("does not re-add legacy contact after it was intentionally removed", async () => {
		const { syncHomeContacts } = await import("../../server/utils/homeContacts");

		const contacts = await syncHomeContacts({
			id: "home-1",
			name: "Haus 1",
			ownerIds: ["owner-1"],
			ownerEmail: "legacy@example.com",
			ownerPhone: "+41 79 111 11 11",
			photos: [],
			files: [],
			privateFiles: [],
			folders: [],
			enabled: true,
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-01T00:00:00.000Z",
			contacts: [
				{
					id: "owner-owner-1",
					name: "Erster Owner",
					hidden: false,
					isOwner: true,
				},
			],
		});

		expect(contacts).toHaveLength(1);
		expect(contacts[0].id).toBe("owner-owner-1");
	});
});
