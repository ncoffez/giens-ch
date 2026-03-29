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

	if (canAccessDocuments) {
		items.splice(2 + Number(includeHome), 0, createPrimaryNavigationItem(
			t("nav.documents"),
			localePath("/documents"),
			"i-lucide-folder",
			routePath.startsWith("/documents") || routePath.startsWith("/fr/documents"),
		));
	}

	return items;
}
