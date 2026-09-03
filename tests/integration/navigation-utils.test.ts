import { describe, expect, it } from "vitest";
import {
	buildAdminNavigationItems,
	buildMobileMenuSections,
	buildMobileTabItems,
	buildNavigationItems,
	buildPublicNavigationItems,
	type MobileMenuFlags,
} from "../../app/utils/navigation";

describe("navigation helpers", () => {
	const t = (key: string) => ({
		"nav.home": "Home",
		"nav.travel": "Anreise",
		"nav.entdecken": "Entdecken",
		"nav.documents": "Dokumente",
		"nav.organisatorisches": "Organisatorisches",
		"nav.profile": "Profil",
		"nav.myHomes": "Mein Haus",
		"nav.admin": "Verwaltung",
		"nav.login": "Login",
		"nav.logout": "Logout",
		"mobileMenu.sections.admin": "Verwaltung",
		"admin.nav.homes": "Häuser",
		"admin.nav.users": "Benutzer",
		"admin.nav.labels": "Labels",
		"admin.nav.trash": "Papierkorb",
		"admin.nav.settings": "Einstellungen",
	}[key] ?? key);
	const localePath = (path: string) => path;
	const loginPath = { path: "/login", query: { redirect: "/" } };

	const noAccess: MobileMenuFlags = {
		isLoggedIn: false,
		canAccessDocuments: false,
		isAdmin: false,
	};

	it("orders public navigation as travel, entdecken, organisatorisches", () => {
		const items = buildPublicNavigationItems(t, localePath, "/travel");

		expect(items.map((item) => item.label)).toEqual([
			"Anreise",
			"Entdecken",
			"Organisatorisches",
		]);
		expect(items[0]?.active).toBe(true);
	});

	it("places documents last for authenticated navigation", () => {
		const items = buildNavigationItems(t, localePath, "/documents", true, true);

		expect(items.map((item) => item.label)).toEqual([
			"Home",
			"Anreise",
			"Entdecken",
			"Organisatorisches",
			"Dokumente",
		]);
		expect(items[4]?.active).toBe(true);
	});

	it("keeps compact navigation in the same order without home", () => {
		const items = buildNavigationItems(t, localePath, "/entdecken", true, false);

		expect(items.map((item) => item.label)).toEqual([
			"Anreise",
			"Entdecken",
			"Organisatorisches",
			"Dokumente",
		]);
		expect(items[1]?.active).toBe(true);
	});

	describe("mobile bottom-bar tabs", () => {
		it("always returns the same 3 fixed tabs regardless of auth state", () => {
			const items = buildMobileTabItems(t, localePath, "/entdecken");

			expect(items.map((item) => item.label)).toEqual([
				"Home",
				"Entdecken",
				"Organisatorisches",
			]);
			expect(items[1]?.active).toBe(true);
		});
	});

	describe("mobile menu sections", () => {
		it("uses a flat unlabeled list with travel and login when logged out", () => {
			const sections = buildMobileMenuSections(t, localePath, "/", noAccess, loginPath);

			expect(sections.map((section) => section.id)).toEqual(["main"]);
			expect(sections[0]?.label).toBeUndefined();
			expect(sections[0]?.items.map((item) => item.id)).toEqual(["travel", "login"]);
			expect(sections[0]?.items[1]).toMatchObject({
				label: "Login",
				to: loginPath,
			});
		});

		it("adds documents to the same list when the user can access them", () => {
			const sections = buildMobileMenuSections(
				t,
				localePath,
				"/documents",
				{ ...noAccess, canAccessDocuments: true },
				loginPath,
			);

			expect(sections[0]?.items.map((item) => item.id)).toEqual(["travel", "documents", "login"]);
			expect(sections[0]?.items.find((item) => item.id === "documents")?.active).toBe(true);
			expect(sections[0]?.items.some((item) => item.id === "owner-documents")).toBe(false);
		});

		it("shows my-homes for any logged-in user, regardless of the homes feature flag", () => {
			const sections = buildMobileMenuSections(
				t,
				localePath,
				"/profile/me",
				{ ...noAccess, isLoggedIn: true },
				loginPath,
			);

			expect(sections.some((section) => section.id === "login")).toBe(false);
			expect(sections[0]?.items.map((item) => item.id)).toEqual([
				"travel",
				"my-homes",
				"profile",
				"logout",
			]);
			expect(sections[0]?.items.find((item) => item.id === "my-homes")).toMatchObject({
				label: "Mein Haus",
			});
			expect(sections[0]?.items.find((item) => item.id === "profile")?.active).toBe(true);
		});

		it("lists the admin tools instead of a single verwaltung landing page", () => {
			const sections = buildMobileMenuSections(
				t,
				localePath,
				"/admin/users",
				{ ...noAccess, isLoggedIn: true, isAdmin: true },
				loginPath,
			);

			const admin = sections.find((section) => section.id === "admin");
			expect(admin?.label).toBe("Verwaltung");
			expect(admin?.items.map((item) => item.id)).toEqual([
				"admin-homes",
				"admin-users",
				"admin-labels",
				"admin-trash",
				"admin-settings",
			]);
			expect(admin?.items.find((item) => item.id === "admin-users")).toMatchObject({
				label: "Benutzer",
				to: "/admin/users",
				active: true,
			});
		});

		it("marks french locale routes as active without duplicating tab destinations", () => {
			const sections = buildMobileMenuSections(
				t,
				(path: string) => `/fr${path === "/" ? "" : path}`,
				"/fr/travel",
				noAccess,
				loginPath,
			);

			expect(sections.flatMap((section) => section.items.map((item) => item.id))).toEqual([
				"travel",
				"login",
			]);
			expect(sections[0]?.items[0]).toMatchObject({
				id: "travel",
				to: "/fr/travel",
				active: true,
			});
		});
	});

	describe("admin navigation", () => {
		it("highlights homes including nested edit routes", () => {
			const items = buildAdminNavigationItems(t, localePath, "/admin/homes/haus-3/edit");

			expect(items.find((item) => item.id === "admin-homes")?.active).toBe(true);
			expect(items.filter((item) => item.active)).toHaveLength(1);
		});
	});
});
