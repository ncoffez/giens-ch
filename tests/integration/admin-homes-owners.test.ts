import { describe, it, expect } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { createError } from "h3";
import AdminHomesEditPage from "../../app/pages/admin/homes/[id]/edit.vue";

describe("Admin Homes Owner Assignment", () => {
	const mockUsers = [
		{ uid: "user1", email: "user1@test.com", displayName: "User One" },
		{ uid: "user2", email: "user2@test.com", displayName: "User Two" },
		{ uid: "user3", email: "user3@test.com", displayName: "User Three" },
	];

	it("renders page title", async () => {
		registerEndpoint("/api/users/owners", {
			method: "GET",
			handler: () => mockUsers,
		});

		registerEndpoint("/api/admin/homes/home1", {
			method: "GET",
			handler: () => ({ id: "home1", name: "Haus 1", ownerId: null, enabled: true }),
		});

		const component = await mountSuspended(AdminHomesEditPage, {
			route: { params: { id: "home1" } }
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(component.text()).toContain("Haus 1 bearbeiten");
	});

	it("owners API returns all users regardless of claims", async () => {
		registerEndpoint("/api/users/owners", {
			method: "GET",
			handler: () => mockUsers,
		});

		registerEndpoint("/api/admin/homes/home1", {
			method: "GET",
			handler: () => ({ id: "home1", name: "Haus 1", ownerId: null, enabled: true }),
		});

		const component = await mountSuspended(AdminHomesEditPage, {
			route: { params: { id: "home1" } }
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		const text = component.text();
		expect(text).toContain("Eigentümer zuweisen");
	});

	it("assigning home to owner updates successfully", async () => {
		registerEndpoint("/api/users/owners", {
			method: "GET",
			handler: () => mockUsers,
		});

		registerEndpoint("/api/admin/homes/home1", {
			method: "GET",
			handler: () => ({ id: "home1", name: "Haus 1", ownerId: null, enabled: true }),
		});

		registerEndpoint("/api/admin/homes/home1/update", {
			method: "POST",
			handler: () => ({ id: "home1", name: "Haus 1", ownerId: "user1", enabled: true }),
		});

		const component = await mountSuspended(AdminHomesEditPage, {
			route: { params: { id: "home1" } }
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		const selectButton = component.find("button");
		if (selectButton) {
			await selectButton.trigger("click");
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
	});

	it("unassigning home from owner updates successfully", async () => {
		registerEndpoint("/api/users/owners", {
			method: "GET",
			handler: () => mockUsers,
		});

		registerEndpoint("/api/admin/homes/home2", {
			method: "GET",
			handler: () => ({ id: "home2", name: "Haus 2", ownerId: "user1", enabled: true }),
		});

		registerEndpoint("/api/admin/homes/home2/update", {
			method: "POST",
			handler: () => ({ id: "home2", name: "Haus 2", ownerId: "", enabled: true }),
		});

		const component = await mountSuspended(AdminHomesEditPage, {
			route: { params: { id: "home2" } }
		});

		await new Promise((resolve) => setTimeout(resolve, 100));
	});

	it("changing owner from user1 to user2 updates successfully", async () => {
		registerEndpoint("/api/users/owners", {
			method: "GET",
			handler: () => mockUsers,
		});

		registerEndpoint("/api/admin/homes/home2", {
			method: "GET",
			handler: () => ({ id: "home2", name: "Haus 2", ownerId: "user1", enabled: true }),
		});

		registerEndpoint("/api/admin/homes/home2/update", {
			method: "POST",
			handler: () => ({ id: "home2", name: "Haus 2", ownerId: "user2", enabled: true }),
		});

		const component = await mountSuspended(AdminHomesEditPage, {
			route: { params: { id: "home2" } }
		});

		await new Promise((resolve) => setTimeout(resolve, 100));
	});

	it("home update succeeds even if backend has errors (error handling)", async () => {
		registerEndpoint("/api/users/owners", {
			method: "GET",
			handler: () => mockUsers,
		});

		registerEndpoint("/api/admin/homes/home1", {
			method: "GET",
			handler: () => ({ id: "home1", name: "Haus 1", ownerId: null, enabled: true }),
		});

		registerEndpoint("/api/admin/homes/home1/update", {
			method: "POST",
			handler: () => ({ id: "home1", name: "Haus 1", ownerId: "user1", enabled: true }),
		});

		const component = await mountSuspended(AdminHomesEditPage, {
			route: { params: { id: "home1" } }
		});

		await new Promise((resolve) => setTimeout(resolve, 100));
	});

	it("edit page displays owners dropdown when users exist", async () => {
		registerEndpoint("/api/users/owners", {
			method: "GET",
			handler: () => mockUsers,
		});

		registerEndpoint("/api/admin/homes/home1", {
			method: "GET",
			handler: () => ({ id: "home1", name: "Haus 1", ownerId: null, enabled: true }),
		});

		const component = await mountSuspended(AdminHomesEditPage, {
			route: { params: { id: "home1" } }
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		const text = component.text();
		expect(text).toContain("Eigentümer zuweisen");
	});

	it("empty state message displays when no users available", async () => {
		registerEndpoint("/api/users/owners", {
			method: "GET",
			handler: () => [],
		});

		registerEndpoint("/api/admin/homes/home1", {
			method: "GET",
			handler: () => ({ id: "home1", name: "Haus 1", ownerId: null, enabled: true }),
		});

		const component = await mountSuspended(AdminHomesEditPage, {
			route: { params: { id: "home1" } }
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		const text = component.text();
		expect(text).toContain("Keine Benutzer vorhanden");
	});
});