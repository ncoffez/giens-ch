import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { formatMemoriamPeriod, memoriamBioForLocale } from "../../app/utils/memoriam";
import MemoriamSection from "../../app/components/memoriam/MemoriamSection.vue";
import AdminMemoriamPage from "../../app/pages/admin/memoriam.vue";

vi.mock("../../server/useFirebaseAdmin", () => {
	const docs = new Map<string, Record<string, unknown>>();
	return {
		db: {
			collection: (name: string) => ({
				async get() {
					const entries = [...docs.entries()]
						.filter(([key]) => key.startsWith(`${name}/`))
						.map(([key, data]) => ({
							id: key.slice(name.length + 1),
							data: () => data,
						}));
					return { docs: entries };
				},
				doc: (id: string) => ({
					async get() {
						const data = docs.get(`${name}/${id}`);
						return {
							id,
							exists: Boolean(data),
							data: () => data,
						};
					},
					async set(data: Record<string, unknown>) {
						docs.set(`${name}/${id}`, { ...data });
					},
					async update(data: Record<string, unknown>) {
						docs.set(`${name}/${id}`, { ...docs.get(`${name}/${id}`), ...data });
					},
					async delete() {
						docs.delete(`${name}/${id}`);
					},
				}),
			}),
		},
		storage: {
			bucket: () => ({
				file: () => ({
					save: vi.fn(),
					getSignedUrl: vi.fn(async () => ["https://example.com/photo.jpg"]),
				}),
				getFiles: vi.fn(async () => [[]]),
			}),
		},
	};
});

vi.mock("../../server/utils/htmlTranslation", () => ({
	hasTranslatableText: (html: string) => Boolean(html?.replace(/<[^>]*>/g, "").trim()),
	translateHtml: vi.fn(async (html: string) => html.replace("Deutscher Text", "Texte français")),
}));

const {
	canReadMemoriam,
	canWriteMemoriam,
	parsePeriodValue,
	parseMemoriamFields,
	serializeMemoriamEntry,
	sortMemoriamEntries,
	createMemoriamEntry,
	listMemoriamEntries,
	reorderMemoriamEntries,
	updateMemoriamEntry,
} = await import("../../server/utils/memoriam");
const { buildSearchPages } = await import("../../server/utils/siteSearch");

describe("memoriam access", () => {
	it("lets owners and admins read, but not guests or other roles", () => {
		expect(canReadMemoriam(null)).toBe(false);
		expect(canReadMemoriam({})).toBe(false);
		expect(canReadMemoriam({ owner: true })).toBe(true);
		expect(canReadMemoriam({ admin: true })).toBe(true);
	});

	it("lets only admins write", () => {
		expect(canWriteMemoriam(null)).toBe(false);
		expect(canWriteMemoriam({ owner: true })).toBe(false);
		expect(canWriteMemoriam({ admin: true })).toBe(true);
	});

	it("indexes In Memoriam in search for owners, not guests", () => {
		const ownerPages = buildSearchPages("de", { owner: true });
		const guestPages = buildSearchPages("de", null);

		expect(ownerPages.some((page) => page.id === "page-memoriam")).toBe(true);
		expect(ownerPages.find((page) => page.id === "page-memoriam")?.to).toBe("/organisatorisches#in-memoriam");
		expect(guestPages.some((page) => page.id === "page-memoriam")).toBe(false);
	});
});

describe("memoriam period and payload", () => {
	it("accepts years and ISO dates", () => {
		expect(parsePeriodValue("1990")).toBe("1990");
		expect(parsePeriodValue("1990-06-15")).toBe("1990-06-15");
		expect(parsePeriodValue("  ")).toBe("");
		expect(parsePeriodValue(undefined)).toBe("");
	});

	it("rejects invalid periods", () => {
		expect(() => parsePeriodValue("June 1990")).toThrow();
		expect(() => parsePeriodValue(1990)).toThrow();
	});

	it("requires a name when creating", () => {
		expect(() => parseMemoriamFields({}, { nameRequired: true })).toThrow();
		expect(parseMemoriamFields({ name: "  Anna  " }, { nameRequired: true }).name).toBe("Anna");
	});
});

describe("memoriam locale mapping", () => {
	const entry = {
		bio: "<p>Deutscher Text</p>",
		bioByLocale: {
			de: "<p>Deutscher Text</p>",
			fr: "<p>Texte français</p>",
		},
	};

	it("returns the French bio when present and falls back to German", () => {
		expect(memoriamBioForLocale(entry, "fr")).toBe("<p>Texte français</p>");
		expect(memoriamBioForLocale(entry, "de")).toBe("<p>Deutscher Text</p>");
		expect(memoriamBioForLocale({
			bio: "<p>Deutscher Text</p>",
			bioByLocale: { de: "<p>Deutscher Text</p>" },
		}, "fr")).toBe("<p>Deutscher Text</p>");
	});

	it("formats years and dates as a residence period", () => {
		expect(formatMemoriamPeriod("1990", "2010")).toBe("1990–2010");
		expect(formatMemoriamPeriod("1990-06-15", "2010")).toBe("15.06.1990–2010");
		expect(formatMemoriamPeriod("1990", "")).toBe("1990");
	});
});

describe("memoriam records", () => {
	it("serializes missing locale fields with a German fallback", () => {
		const entry = serializeMemoriamEntry("a1", {
			name: "Anna",
			bio: "<p>Hallo</p>",
			periodFrom: "1990",
			periodTo: "2001",
		});

		expect(entry.bioByLocale.de).toBe("<p>Hallo</p>");
		expect(entry.bioByLocale.fr).toBeUndefined();
		expect(entry.photos).toEqual([]);
		expect(entry.sortOrder).toBe(0);
	});

	it("sorts by residence end, then start, then name when sortOrder is equal", () => {
		const sorted = sortMemoriamEntries([
			serializeMemoriamEntry("1", { name: "Berta", periodFrom: "1980", periodTo: "2000" }),
			serializeMemoriamEntry("2", { name: "Anna", periodFrom: "1990", periodTo: "2010" }),
			serializeMemoriamEntry("3", { name: "Clara", periodFrom: "1985", periodTo: "2010" }),
		]);

		expect(sorted.map((entry) => entry.name)).toEqual(["Anna", "Clara", "Berta"]);
	});

	it("sorts by explicit sortOrder first", () => {
		const sorted = sortMemoriamEntries([
			serializeMemoriamEntry("1", { name: "Last", sortOrder: 2, periodTo: "1990" }),
			serializeMemoriamEntry("2", { name: "First", sortOrder: 0, periodTo: "2010" }),
			serializeMemoriamEntry("3", { name: "Middle", sortOrder: 1, periodTo: "2000" }),
		]);

		expect(sorted.map((entry) => entry.name)).toEqual(["First", "Middle", "Last"]);
	});

	it("creates an entry and translates the German bio", async () => {
		const created = await createMemoriamEntry({
			name: "Anna Meier",
			bio: "<p>Deutscher Text</p>",
			periodFrom: "1990",
			periodTo: "2010",
		}, "admin-1");

		expect(created.name).toBe("Anna Meier");
		expect(created.bioByLocale?.de).toBe("<p>Deutscher Text</p>");
		expect(created.bioByLocale?.fr).toBe("<p>Texte français</p>");

		const listed = await listMemoriamEntries();
		expect(listed.some((entry) => entry.id === created.id)).toBe(true);

		const updated = await updateMemoriamEntry(created.id, { name: "Anna M." }, "admin-1");
		expect(updated.name).toBe("Anna M.");
		expect(updated.bioByLocale?.fr).toBe("<p>Texte français</p>");
	});

	it("persists a manual list order", async () => {
		await createMemoriamEntry({ name: "Reorder A", periodFrom: "1990" }, "admin-1");
		await createMemoriamEntry({ name: "Reorder B", periodFrom: "1991" }, "admin-1");
		const listed = await listMemoriamEntries();
		const reversed = [...listed].reverse().map((entry) => entry.id);

		const reordered = await reorderMemoriamEntries(reversed);

		expect(reordered.map((entry) => entry.id)).toEqual(reversed);
		expect(reordered.map((entry) => entry.sortOrder)).toEqual(reversed.map((_, index) => index));
	});
});

describe("memoriam UI", () => {
	it("does not render the public section for guests", async () => {
		const component = await mountSuspended(MemoriamSection);
		expect(component.find("[data-memoriam-section]").exists()).toBe(false);
	});

	it("keeps the organisatorisches embed behind ClientOnly and owner visibility", () => {
		const source = readFileSync("app/pages/organisatorisches.vue", "utf8");
		expect(source).toContain("MemoriamSection");
		expect(source).toContain("ClientOnly");
		expect(source).toContain('v-if="isOwner"');
	});

	it("does not add a public navigation item", () => {
		const source = readFileSync("app/utils/navigation.ts", "utf8");
		const publicNav = source.slice(
			source.indexOf("export function buildPublicNavigationItems"),
			source.indexOf("export function buildNavigationItems"),
		);
		const mobileTabs = source.slice(
			source.indexOf("export function buildMobileTabItems"),
			source.indexOf("function pathWithoutLocale"),
		);

		expect(source).toContain("admin-memoriam");
		expect(publicNav.toLowerCase()).not.toContain("memoriam");
		expect(mobileTabs.toLowerCase()).not.toContain("memoriam");
	});

	it("renders existing admin entries from the API", async () => {
		registerEndpoint("/api/admin/memoriam", {
			method: "GET",
			handler: () => [
				{
					id: "a1",
					name: "Anna Meier",
					photos: [],
					bio: "<p>Hallo</p>",
					bioByLocale: { de: "<p>Hallo</p>" },
					periodFrom: "1990",
					periodTo: "2010",
					createdAt: "",
					updatedAt: "",
				},
			],
		});

		const component = await mountSuspended(AdminMemoriamPage);
		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(component.text()).toContain("In Memoriam");
		expect(component.text()).toContain("Anna Meier");
		expect(component.text()).toContain("1990–2010");
		expect(component.text()).toContain("Neuer Eintrag");
	});

	it("opens the create dialog from the admin overview", async () => {
		registerEndpoint("/api/admin/memoriam", {
			method: "GET",
			handler: () => [],
		});

		const component = await mountSuspended(AdminMemoriamPage);
		await new Promise((resolve) => setTimeout(resolve, 50));

		const createButton = component.findAll("button").find((button) => button.text().includes("Neuer Eintrag"));
		expect(createButton).toBeTruthy();
		await createButton!.trigger("click");
		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(document.body.textContent || "").toContain("Lauftext");
		expect(document.body.textContent || "").toContain("Speichern");
		expect(document.body.textContent || "").toContain("Zeitraum in der Résidence");
		expect(document.body.textContent || "").toContain("Von");
		expect(document.body.textContent || "").toContain("Bis");
	});

	it("shows reorder controls when several entries exist", async () => {
		registerEndpoint("/api/admin/memoriam", {
			method: "GET",
			handler: () => [
				{
					id: "a1",
					name: "Anna Meier",
					photos: [],
					bio: "",
					periodFrom: "1990",
					periodTo: "2010",
					sortOrder: 0,
					createdAt: "",
					updatedAt: "",
				},
				{
					id: "a2",
					name: "Peter Keller",
					photos: [],
					bio: "",
					periodFrom: "1980",
					periodTo: "2000",
					sortOrder: 1,
					createdAt: "",
					updatedAt: "",
				},
			],
		});

		const component = await mountSuspended(AdminMemoriamPage);
		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(component.text()).toContain("Reihenfolge mit den Pfeilen ändern.");
		expect(component.findAll("[data-memoriam-move-up]").length).toBeGreaterThan(0);
		expect(component.findAll("[data-memoriam-move-down]").length).toBeGreaterThan(0);
	});

	it("previews selected photos immediately and opens a lightbox on the public section", () => {
		expect(readFileSync("app/pages/admin/memoriam.vue", "utf8")).toContain("createObjectURL");
		expect(readFileSync("app/pages/admin/memoriam.vue", "utf8")).toContain("previewUrl");
		expect(readFileSync("app/components/memoriam/MemoriamSection.vue", "utf8")).toContain("data-memoriam-lightbox");
		expect(readFileSync("app/components/memoriam/MemoriamSection.vue", "utf8")).toContain("openLightbox");
	});
});
