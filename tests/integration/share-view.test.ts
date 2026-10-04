import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { Home, HomeContact } from "../../types";
import HomeShareView from "../../app/components/homes/HomeShareView.vue";

const home = {
	id: "home-1",
	name: "Haus 4",
	ownerIds: ["owner-a"],
	photos: ["https://example.com/haus.jpg"],
	files: [{
		id: "file-1",
		name: "Plan.pdf",
		type: "application/pdf",
		size: 1200,
		url: "https://example.com/plan.pdf",
		folderId: null,
		uploadedAt: "2026-01-01T00:00:00.000Z",
		uploadedBy: "owner-a",
		visibility: "shared",
	}],
	folders: [],
	wifiSSID: "Beausoleil",
	wifiPassword: "geheim-pass",
	instructions: "<p>Die Alarmanlage steht links.</p>",
	enabled: true,
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
} as Home;

const contacts = [{
	id: "contact-1",
	name: "Patrik Auberson",
	phone: "+41 79 000 00 00",
	hidden: false,
	isOwner: true,
}] as HomeContact[];

describe("share view", () => {
	it("uses a funnel layout and hides the bug report on the public link", () => {
		expect(readFileSync("app/pages/homes/share/[token].vue", "utf8")).toContain('layout: "share"');
		expect(readFileSync("app/layouts/share.vue", "utf8")).not.toContain("UNavigationMenu");
		expect(readFileSync("app/layouts/share.vue", "utf8")).toContain("localePath('/')");
		expect(readFileSync("app/layouts/share.vue", "utf8")).not.toContain("pointer-events-none");
		expect(readFileSync("app/app.vue", "utf8")).toContain("/homes/share/");
	});

	it("hides stay details from a prospect", async () => {
		const view = await mountSuspended(HomeShareView, {
			props: {
				home,
				contacts,
				audience: "prospect",
				downloadFile: () => undefined,
			},
		});

		expect(view.text()).toContain("Haus 4");
		expect(view.text()).toContain("2 Schlafzimmer");
		expect(view.text()).toContain("Küche");
		expect(view.text()).toContain("Sitzplatz");
		expect(view.text()).toContain("TV");
		expect(view.text()).toContain("Avenue des Arbanais");
		expect(view.html()).toContain("43.037673,6.145289");
		expect(view.html()).toContain("output=embed");
		expect(view.text()).not.toContain("geheim-pass");
		expect(view.text()).not.toContain("Beausoleil");
		expect(view.text()).not.toContain("Plan.pdf");
		expect(view.text()).not.toContain("Patrik Auberson");
		expect(view.text()).not.toContain("WLAN");
		expect(view.html()).not.toContain("Die Alarmanlage");
	});

	it("shows stay details to a tenant", async () => {
		const view = await mountSuspended(HomeShareView, {
			props: {
				home,
				contacts,
				audience: "tenant",
				downloadFile: () => undefined,
			},
		});

		expect(view.text()).toContain("WLAN");
		expect(view.text()).toContain("Beausoleil");
		expect(view.text()).not.toContain("Sitzplatz");
		expect(view.html()).not.toContain("output=embed");
		expect(view.text()).not.toContain("geheim-pass");
		expect(view.text()).toContain("Plan.pdf");
		expect(view.text()).toContain("Patrik Auberson");
		expect(view.html()).toContain("Die Alarmanlage");
	});
});
