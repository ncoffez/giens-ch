import type { NavigationMenuItem } from "@nuxt/ui";

function createPrimaryNavigationItem(label: string, to: string, icon: string, active: boolean): NavigationMenuItem {
	return {
		label,
		to,
		icon,
		active,
	};
}

export function buildPublicNavigationItems(
	t: (key: string) => string,
	localePath: (path: string) => string,
	routePath: string
): NavigationMenuItem[] {
	return [
		createPrimaryNavigationItem(
			t("nav.travel"),
			localePath("/travel"),
			"i-lucide-car",
			routePath === "/travel" || routePath === "/fr/travel",
		),
		createPrimaryNavigationItem(
			t("nav.entdecken"),
			localePath("/entdecken"),
			"i-lucide-map",
			routePath === "/entdecken" || routePath === "/fr/entdecken",
		),
		createPrimaryNavigationItem(
			t("nav.organisatorisches"),
			localePath("/organisatorisches"),
			"i-lucide-clipboard-list",
			routePath === "/organisatorisches" || routePath === "/fr/organisatorisches",
		),
	];
}

export function buildNavigationItems(
	t: (key: string) => string,
	localePath: (path: string) => string,
	routePath: string,
	canAccessDocuments: boolean,
	includeHome: boolean
): NavigationMenuItem[] {
	const items: NavigationMenuItem[] = [];

	if (includeHome) {
		items.push(
			createPrimaryNavigationItem(
				t("nav.home"),
				localePath("/"),
				"i-lucide-house",
				routePath === "/" || routePath === "/fr",
			),
		);
	}

	items.push(...buildPublicNavigationItems(t, localePath, routePath));

	// Documents closes the menu: Home > Anreise > Entdecken > Organisatorisches > Dokumente.
	if (canAccessDocuments) {
		items.push(createPrimaryNavigationItem(
			t("nav.documents"),
			localePath("/documents"),
			"i-lucide-folder",
			routePath.startsWith("/documents") || routePath.startsWith("/fr/documents"),
		));
	}

	return items;
}

/**
 * Fixed set of mobile bottom-bar tabs. Deliberately auth-independent so the
 * bar never reshuffles once client-side auth state resolves after hydration.
 * The 4th slot ("Menü") is rendered by the mobile nav component itself.
 */
export function buildMobileTabItems(
	t: (key: string) => string,
	localePath: (path: string) => string,
	routePath: string,
): NavigationMenuItem[] {
	return [
		createPrimaryNavigationItem(
			t("nav.home"),
			localePath("/"),
			"i-lucide-house",
			routePath === "/" || routePath === "/fr",
		),
		createPrimaryNavigationItem(
			t("nav.entdecken"),
			localePath("/entdecken"),
			"i-lucide-map",
			routePath === "/entdecken" || routePath === "/fr/entdecken",
		),
		createPrimaryNavigationItem(
			t("nav.organisatorisches"),
			localePath("/organisatorisches"),
			"i-lucide-clipboard-list",
			routePath === "/organisatorisches" || routePath === "/fr/organisatorisches",
		),
	];
}

function pathWithoutLocale(path: string): string {
	return path.replace(/^\/fr/, "") || "/";
}

function isUnderPath(routePath: string, prefix: string): boolean {
	return pathWithoutLocale(routePath).startsWith(prefix);
}

export interface MobileMenuItem {
	id: string;
	label: string;
	to: string | { path: string; query?: Record<string, string> };
	icon: string;
	active?: boolean;
}

export interface MobileMenuSection {
	id: string;
	label?: string;
	items: MobileMenuItem[];
}

export interface MobileMenuFlags {
	isLoggedIn: boolean;
	canAccessDocuments: boolean;
	isAdmin: boolean;
}

export function buildAdminNavigationItems(
	t: (key: string) => string,
	localePath: (path: string) => string,
	routePath: string,
): MobileMenuItem[] {
	return [
		{
			id: "admin-homes",
			label: t("admin.nav.homes"),
			to: localePath("/admin/homes"),
			icon: "i-lucide-building-2",
			active: isUnderPath(routePath, "/admin/homes"),
		},
		{
			id: "admin-users",
			label: t("admin.nav.users"),
			to: localePath("/admin/users"),
			icon: "i-lucide-users",
			active: isUnderPath(routePath, "/admin/users") || pathWithoutLocale(routePath) === "/admin",
		},
		{
			id: "admin-labels",
			label: t("admin.nav.labels"),
			to: localePath("/admin/labels"),
			icon: "i-lucide-tags",
			active: isUnderPath(routePath, "/admin/labels"),
		},
		{
			id: "admin-trash",
			label: t("admin.nav.trash"),
			to: localePath("/admin/trash"),
			icon: "i-lucide-trash-2",
			active: isUnderPath(routePath, "/admin/trash"),
		},
		{
			id: "admin-settings",
			label: t("admin.nav.settings"),
			to: localePath("/admin/settings"),
			icon: "i-lucide-settings",
			active: isUnderPath(routePath, "/admin/settings"),
		},
	];
}

/**
 * Destinations for the mobile "Menü" sheet. Home/Entdecken/Organisatorisches
 * stay in the tab bar. Headings are used only for the admin cluster — a
 * single unlabeled list covers travel, documents, homes, and account.
 */
export function buildMobileMenuSections(
	t: (key: string) => string,
	localePath: (path: string) => string,
	routePath: string,
	flags: MobileMenuFlags,
	loginPath: { path: string; query?: Record<string, string> },
): MobileMenuSection[] {
	const mainItems: MobileMenuItem[] = [
		{
			id: "travel",
			label: t("nav.travel"),
			to: localePath("/travel"),
			icon: "i-lucide-car",
			active: isUnderPath(routePath, "/travel"),
		},
	];

	if (flags.canAccessDocuments) {
		mainItems.push({
			id: "documents",
			label: t("nav.documents"),
			to: localePath("/documents"),
			icon: "i-lucide-folder",
			active: isUnderPath(routePath, "/documents"),
		});
	}

	if (flags.isLoggedIn) {
		mainItems.push(
			{
				id: "my-homes",
				label: t("nav.myHomes"),
				to: localePath("/my-homes"),
				icon: "i-lucide-building-2",
				active: isUnderPath(routePath, "/my-homes"),
			},
			{
				id: "profile",
				label: t("nav.profile"),
				to: localePath("/profile/me"),
				icon: "i-lucide-user",
				active: isUnderPath(routePath, "/profile"),
			},
			{
				id: "logout",
				label: t("nav.logout"),
				to: localePath("/logout"),
				icon: "i-lucide-log-out",
			},
		);
	} else {
		mainItems.push({
			id: "login",
			label: t("nav.login"),
			to: loginPath,
			icon: "i-lucide-log-in",
		});
	}

	const sections: MobileMenuSection[] = [
		{
			id: "main",
			items: mainItems,
		},
	];

	if (flags.isAdmin) {
		sections.push({
			id: "admin",
			label: t("mobileMenu.sections.admin"),
			items: buildAdminNavigationItems(t, localePath, routePath),
		});
	}

	return sections;
}
