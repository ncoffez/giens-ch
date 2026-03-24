<template>
	<div class="mx-auto md:px-8 px-4 min-h-screen flex flex-col">
		<!-- Skip to content link for accessibility -->
		<a
			href="#main-content"
			class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:outline-none"
		>
			Zum Inhalt springen
		</a>

		<!-- Navigation Header -->
		<header class="flex items-center justify-between py-4 md:py-6 max-w-screen-xl mx-auto w-full">
			<div class="flex items-center gap-8">
				<NuxtLink :to="localePath('/')">
					<UiLogo class="m-0!" />
				</NuxtLink>
				<div class="hidden lg:block">
					<ClientOnly>
						<UNavigationMenu :items="navigationItems" />
						<template #fallback>
							<UNavigationMenu :items="publicNavigationItems" />
						</template>
					</ClientOnly>
				</div>
			</div>

			<ClientOnly>
				<div class="flex items-center gap-2 md:gap-3">
					<div class="hidden lg:block">
						<UButton
							icon="i-lucide-search"
							color="neutral"
							variant="ghost"
							class="rounded-full"
							aria-label="Suchen"
							@click="openSearch" />
					</div>

					<UiLanguageSwitcher />

					<UDropdownMenu
						:items="themeItems"
						:ui="{ content: 'w-40' }">
						<UButton
							:icon="currentThemeIcon"
							color="neutral"
							variant="ghost"
							class="rounded-full"
							:aria-label="'Farbschema ändern'" />
					</UDropdownMenu>
					<div class="hidden lg:block">
						<template v-if="!currentUser.value">
							<UButton
								:to="localePath('/login')"
								:label="t('nav.login')"
								icon="i-lucide-circle-user"
								color="neutral"
								variant="ghost" />
						</template>
						<template v-else>
							<UDropdownMenu :items="userItems" :ui="{ content: 'w-48' }">
								<UButton
									:label="(currentUser.value?.displayName || currentUser.value?.email || currentUser.value?.name || currentUser.value) ?? 'Profil'"
									icon="i-lucide-circle-user"
									color="neutral"
									variant="ghost"
									trailing-icon="i-lucide-chevron-down" />
							</UDropdownMenu>
						</template>
					</div>
				</div>
			</ClientOnly>
		</header>

		<!-- Search Modal (accessible from mobile) -->
		<ClientOnly>
			<UiSearchModal />
		</ClientOnly>

		<!-- Main Content -->
		<main id="main-content" class="flex-1 my-4 md:my-6 mb-24 md:mb-20 mx-auto w-full max-w-screen-xl">
			<slot />
		</main>

		<!-- Mobile Navigation -->
		<ClientOnly>
			<UiMobileNav />
		</ClientOnly>

		<!-- Footer -->
		<footer class="py-12 border-t border-stone-100 dark:border-stone-800">
			<div class="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-stone-500">
				<p>{{ t("footer.copyright", { year: new Date().getFullYear() }) }}</p>
			</div>
		</footer>
	</div>
</template>

<script lang="ts" setup>
import type { NavigationMenuItem } from "@nuxt/ui";

const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const nuxtApp = useNuxtApp();
const colorMode = useColorMode();
const { canAccessHomes, fetchSettings, fetchUserPreference } = useFeatureFlags();
const { openSearch } = useSearchModal();

const currentUser = computed(() => import.meta.client ? nuxtApp.$currentUser : null);
const isAdmin = computed(() => import.meta.client ? nuxtApp.$isAdmin : false);
const isOwner = computed(() => import.meta.client ? nuxtApp.$isOwner : false);
const isPublisher = computed(() => import.meta.client ? nuxtApp.$isPublisher : false);
const isReader = computed(() => import.meta.client ? nuxtApp.$isReader : false);

onMounted(async () => {
	await fetchSettings();
	await fetchUserPreference();
});

const currentThemeIcon = computed(() => {
	if (colorMode.value === "dark") return "i-lucide-moon";
	return "i-lucide-sun";
});

const themeItems = [
	[
		{
			label: "System",
			icon: "i-lucide-monitor",
			onSelect: () => {
				colorMode.preference = "system";
			},
		},
		{
			label: "Hell",
			icon: "i-lucide-sun",
			onSelect: () => {
				colorMode.preference = "light";
			},
		},
		{
			label: "Dunkel",
			icon: "i-lucide-moon",
			onSelect: () => {
				colorMode.preference = "dark";
			},
		},
	],
];

const publicNavigationItems = computed<NavigationMenuItem[]>(() => [
	{
		label: t("nav.home"),
		icon: "i-lucide-house",
		to: localePath("/"),
		active: route.path === "/" || route.path === "/fr",
	},
	{
		label: t("nav.travel"),
		to: localePath("/travel"),
		icon: "i-lucide-car",
		active: route.path === "/travel" || route.path === "/fr/travel",
	},
	{
		label: t("nav.about"),
		to: localePath("/about"),
		icon: "i-lucide-info",
		active: route.path === "/about" || route.path === "/fr/about",
	},
]);

const navigationItems = computed<NavigationMenuItem[]>(() => {
	const items: NavigationMenuItem[] = [
		{
			label: t("nav.home"),
			icon: "i-lucide-house",
			to: localePath("/"),
			active: route.path === "/" || route.path === "/fr",
		},
		{
			label: t("nav.organisatorisches"),
			icon: "i-lucide-clipboard-list",
			to: localePath("/organisatorisches"),
			active: route.path === "/organisatorisches" || route.path === "/fr/organisatorisches",
		},
		{
			label: t("nav.travel"),
			to: localePath("/travel"),
			icon: "i-lucide-car",
			active: route.path === "/travel" || route.path === "/fr/travel",
		},
		{
			label: t("nav.about"),
			to: localePath("/about"),
			icon: "i-lucide-info",
			active: route.path === "/about" || route.path === "/fr/about",
		},
	];

	if (import.meta.client && (isOwner.value || isReader.value || isPublisher.value)) {
		items.push({
			label: t("nav.documents"),
			icon: "i-lucide-folder",
			to: localePath("/documents"),
			active: route.path.startsWith("/documents") || route.path.startsWith("/fr/documents"),
		});
	}

	return items;
});

const userItems = computed(() => {
	if (!currentUser.value) {
		return [
			{
				label: t("nav.login"),
				icon: "i-lucide-circle-user",
				to: localePath("/login"),
			},
		];
	}

	const items = [
		{
			label: t("nav.profile"),
			to: localePath("/profile"),
			icon: "i-lucide-user",
		},
	];

	if (import.meta.client && canAccessHomes.value) {
		items.push({
			label: t("nav.myHomes"),
			to: localePath("/my-homes"),
			icon: "i-lucide-home",
		});
	}

	if (import.meta.client && isAdmin.value) {
		items.push({
			label: t("nav.admin"),
			to: localePath("/admin"),
			icon: "i-lucide-settings",
		});
	}

	items.push(
		{
			type: "separator" as const,
		},
		{
			label: t("nav.logout"),
			to: localePath("/logout"),
			icon: "i-lucide-log-out",
		}
	);

	return items;
});
</script>

<style scoped>
@reference "@/assets/main.css";

.router-link-active {
	color: var(--color-primary-600);
}
.dark .router-link-active {
	color: var(--color-primary-400);
}
</style>
