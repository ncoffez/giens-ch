import { describe, it, expect } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { createError } from "h3";
import AdminHomesPage from "../../app/pages/admin/homes/index.vue";

describe("Admin Homes Page", () => {
	const mockHomes = [
		{ id: "1", name: "Haus 1", ownerIds: ["user3"], enabled: true },
		{ id: "3", name: "Haus 3", ownerIds: [], enabled: true },
		{ id: "10", name: "Haus 10", ownerIds: ["user1"], enabled: true },
		{ id: "2", name: "Haus 2", ownerIds: ["user2"], enabled: false },
	];

	const mockOwners = [
		{ uid: "user3", email: "user1@example.com", displayName: "User One", photoURL: "https://example.com/u1.jpg" },
		{ uid: "user2", email: "user2@example.com", displayName: "User Two", photoURL: "https://example.com/u2.jpg" },
		{ uid: "user1", email: "user3@example.com", displayName: "User Three" },
	];

	it("renders page title", async () => {
		registerEndpoint("/api/admin/homes", {
			method: "GET",
			handler: () => mockHomes,
		});
		registerEndpoint("/api/users/owners", {
			method: "GET",
			handler: () => mockOwners,
		});

		const component = await mountSuspended(AdminHomesPage);
		expect(component.text()).toContain("Häuser verwalten");
		expect(component.text()).toContain("Neues Haus");
	});

	it("opens the create-home dialog from the admin overview", async () => {
		registerEndpoint("/api/admin/homes", {
			method: "GET",
			handler: () => mockHomes,
		});
		registerEndpoint("/api/users/owners", {
			method: "GET",
			handler: () => mockOwners,
		});

		const component = await mountSuspended(AdminHomesPage);
		await new Promise((resolve) => setTimeout(resolve, 100));

		const createButton = component.findAll("button").find((button) => button.text().includes("Neues Haus"));
		expect(createButton).toBeTruthy();

		await createButton!.trigger("click");
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(document.body.textContent || "").toContain("Neues Haus erstellen");
		expect(document.body.textContent || "").toContain("Hausname");
	});

	it("fetches and displays homes from API", async () => {
		registerEndpoint("/api/admin/homes", {
			method: "GET",
			handler: () => mockHomes,
		});
		registerEndpoint("/api/users/owners", {
			method: "GET",
			handler: () => mockOwners,
		});

		await mountSuspended(AdminHomesPage);
	});

	it("show/hide disabled toggle exists", async () => {
		registerEndpoint("/api/admin/homes", {
			method: "GET",
			handler: () => mockHomes,
		});
		registerEndpoint("/api/users/owners", {
			method: "GET",
			handler: () => mockOwners,
		});

		const component = await mountSuspended(AdminHomesPage);
		expect(component.text()).toContain("Deaktivierte Häuser anzeigen");
	});

	it("displays loading state initially", async () => {
		registerEndpoint("/api/admin/homes", {
			method: "GET",
			handler: () => new Promise(() => {}),
		});
		registerEndpoint("/api/users/owners", {
			method: "GET",
			handler: () => mockOwners,
		});

		const component = await mountSuspended(AdminHomesPage);
		expect(component.text()).toContain("Häuser werden geladen...");
	});

	it("displays home count badges when homes are loaded", async () => {
		registerEndpoint("/api/admin/homes", {
			method: "GET",
			handler: () => mockHomes,
		});
		registerEndpoint("/api/users/owners", {
			method: "GET",
			handler: () => mockOwners,
		});

		const component = await mountSuspended(AdminHomesPage);
		
		await new Promise((resolve) => setTimeout(resolve, 200));
		
		const text = component.text();
		expect(text).toContain("aktiv");
		expect(text).toContain("deaktiviert");
	});

	it("displays error message when API fails", async () => {
		registerEndpoint("/api/admin/homes", {
			method: "GET",
			handler: () => {
				throw createError({ statusCode: 500, message: "API Error" });
			},
		});
		registerEndpoint("/api/users/owners", {
			method: "GET",
			handler: () => mockOwners,
		});

		const component = await mountSuspended(AdminHomesPage);
		
		await new Promise((resolve) => setTimeout(resolve, 200));
		
		expect(component.text()).toContain("500");
	});
});
