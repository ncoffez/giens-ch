<template>
	<div class="app-shell app-shell-with-mobile-nav mx-auto px-3 md:px-6 min-h-screen flex flex-col">
		<!-- Skip to content link for accessibility -->
		<a
			href="#main-content"
			class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:outline-none"
		>
			Zum Inhalt springen
		</a>

		<!-- Navigation Header -->
		<header class="z-40 py-2 md:sticky md:top-0 md:py-5">
			<div class="flex items-center justify-between gap-3 md:gap-6 max-w-screen-xl mx-auto w-full px-0 py-2 md:rounded-[1.5rem] md:border md:border-[var(--app-border)] md:bg-[var(--app-surface)] md:px-6 md:py-3 md:shadow-[var(--app-shadow)] md:backdrop-blur-[20px]">
				<div class="flex items-center gap-4 md:gap-8 min-w-0">
				<NuxtLink :to="localePath('/')" class="logo-link shrink-0">
					<UiLogo class="m-0!" />
				</NuxtLink>
				<div class="hidden lg:block xl:hidden">
					<ClientOnly>
						<UNavigationMenu v-bind="headerNavigationProps" :items="compactNavigationItems" />
						<template #fallback>
							<UNavigationMenu v-bind="headerNavigationProps" :items="compactPublicNavigationItems" />
						</template>
					</ClientOnly>
				</div>
				<div class="hidden xl:block">
					<ClientOnly>
						<UNavigationMenu v-bind="headerNavigationProps" :items="navigationItems" />
						<template #fallback>
							<UNavigationMenu v-bind="headerNavigationProps" :items="publicNavigationItems" />
						</template>
					</ClientOnly>
				</div>
			</div>

			<ClientOnly>
				<div class="flex items-center gap-1 md:gap-2 xl:gap-1 shrink-0">
					<div class="hidden md:block">
						<UButton
							icon="i-lucide-search"
							color="neutral"
							variant="ghost"
							:class="headerActionButtonClass"
							aria-label="Suchen"
							@click="handleOpenSearch" />
					</div>

					<UiLanguageSwitcher />

					<UDropdownMenu
						:items="themeItems"
						:ui="{ content: 'w-40' }">
						<UButton
							:icon="currentThemeIcon"
							color="neutral"
							variant="ghost"
							:class="headerActionButtonClass"
							:aria-label="'Farbschema ändern'" />
					</UDropdownMenu>
					<div class="hidden lg:block">
						<template v-if="!currentUser">
							<UButton
								:to="loginPath"
								icon="i-lucide-circle-user"
								color="neutral"
								variant="ghost"
								:class="headerActionButtonClass">
								<span class="hidden 2xl:inline">{{ t("nav.login") }}</span>
							</UButton>
						</template>
						<template v-else>
							<UDropdownMenu :items="userItems" :ui="{ content: 'w-48' }">
								<UButton
									color="neutral"
									variant="ghost"
									:class="profileMenuButtonClass"
								>
									<span class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--app-surface-strong)] ring-1 ring-black/6 transition-all dark:ring-white/8">
										<img
											v-if="userPhotoUrl"
											:src="userPhotoUrl"
											:alt="userDisplayName"
											class="h-full w-full rounded-full object-cover"
										/>
										<UIcon
											v-else
											name="i-lucide-circle-user"
											class="h-5 w-5 text-[var(--app-text)]"
										/>
									</span>
									<span class="hidden 2xl:inline min-w-0 truncate text-sm font-medium">
										{{ userDisplayName }}
									</span>
									<span class="hidden 2xl:flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/4 text-[var(--app-muted)] dark:bg-white/6">
										<UIcon name="i-lucide-ellipsis" class="h-4 w-4" />
									</span>
								</UButton>
							</UDropdownMenu>
						</template>
					</div>
				</div>
			</ClientOnly>
			</div>
		</header>

		<!-- Search Modal (accessible from mobile) -->
		<ClientOnly>
			<UiLazySearchModal v-if="isSearchMounted" />
		</ClientOnly>

		<!-- Main Content -->
		<main id="main-content" class="app-main-shell flex-1 my-4 md:my-6 mb-28 md:mb-16 mx-auto w-full max-w-screen-xl">
			<slot />
		</main>

		<!-- Mobile Navigation -->
		<UiMobileNav />

		<!-- Footer -->
		<footer class="py-8 md:py-12">
			<div class="mx-auto flex max-w-screen-xl flex-col items-center justify-between gap-4 border-t border-[var(--app-border)] px-1 pt-6 text-sm app-muted md:flex-row md:px-0 md:pt-8">
				<p>{{ t("footer.copyright", { year: new Date().getFullYear() }) }}</p>
			</div>
		</footer>
	</div>
</template>

<script lang="ts" setup>
import type { NavigationMenuItem } from "@nuxt/ui";
import { buildNavigationItems, buildPublicNavigationItems } from "../utils/navigation";
import { sanitizeRedirectPath } from "../utils/redirect";

const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const nuxtApp = useNuxtApp();
const colorMode = useColorMode();
const { canAccessHomes, fetchSettings, fetchUserPreference } = useFeatureFlags();
const { openSearch, isMounted: isSearchMounted } = useSearchModal();

const currentUser = computed(() => import.meta.client ? nuxtApp.$currentUser?.value ?? null : null);
const authInitialized = computed(() => import.meta.client ? nuxtApp.$authInitialized?.value ?? false : false);
const isAdmin = computed(() => import.meta.client ? nuxtApp.$isAdmin?.value ?? false : false);
const isOwner = computed(() => import.meta.client ? nuxtApp.$isOwner?.value ?? false : false);
const isPublisher = computed(() => import.meta.client ? nuxtApp.$isPublisher?.value ?? false : false);
const isReader = computed(() => import.meta.client ? nuxtApp.$isReader?.value ?? false : false);
const userDisplayName = computed(() =>
	(currentUser.value?.displayName || currentUser.value?.email || currentUser.value?.name || currentUser.value) ?? "Profil"
);
const userPhotoUrl = computed(() => currentUser.value?.photoURL || "");

const hasLoadedUserFlags = ref(false);
const headerActionButtonClass = "rounded-full border border-transparent bg-transparent px-3 text-[var(--app-text)] hover:border-[var(--app-border)] hover:bg-black/5 dark:hover:bg-white/6";
const profileMenuButtonClass = "rounded-full border border-transparent bg-transparent px-1.5 py-1 text-[var(--app-text)] hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[var(--app-primary)]/25 dark:hover:bg-white/6 2xl:px-2.5";
const headerNavigationProps = {
	variant: "link" as const,
	highlight: true,
	color: "neutral" as const,
	ui: {
		link: "rounded-full px-3 py-2 before:bg-transparent hover:before:bg-transparent data-[state=open]:before:bg-transparent",
		linkLeadingIcon: "text-[var(--app-muted)] group-hover:text-[var(--app-text)] group-data-[state=open]:text-[var(--app-text)]",
		linkLabel: "text-[var(--app-text)]",
	},
};

function handleOpenSearch() {
	openSearch();
}

watch([authInitialized, currentUser], async ([initialized, user]) => {
	if (!import.meta.client || hasLoadedUserFlags.value || !initialized || !user) {
		return;
	}

	hasLoadedUserFlags.value = true;
	await Promise.all([fetchSettings(), fetchUserPreference()]);
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

const publicNavigationItems = computed<NavigationMenuItem[]>(() =>
	buildPublicNavigationItems(t, localePath, route.path),
);

const compactPublicNavigationItems = computed<NavigationMenuItem[]>(() =>
	buildPublicNavigationItems(t, localePath, route.path),
);

const navigationItems = computed<NavigationMenuItem[]>(() =>
	buildNavigationItems(
		t,
		localePath,
		route.path,
		import.meta.client && (isOwner.value || isReader.value || isPublisher.value),
		true,
	),
);

const compactNavigationItems = computed<NavigationMenuItem[]>(() =>
	buildNavigationItems(
		t,
		localePath,
		route.path,
		import.meta.client && (isOwner.value || isReader.value || isPublisher.value),
		false,
	),
);

const loginPath = computed(() => ({
	path: localePath("/login"),
	query: {
		redirect: sanitizeRedirectPath(route.fullPath, localePath("/")),
	},
}));

const userItems = computed(() => {
	if (!currentUser.value) {
		return [
			{
				label: t("nav.login"),
				icon: "i-lucide-circle-user",
				to: loginPath.value,
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
@media (orientation: landscape) and (max-width: 1023px) and (max-height: 640px) {
	.app-shell-with-mobile-nav {
		padding-left: calc(5.5rem + env(safe-area-inset-left));
	}

	.app-main-shell {
		margin-bottom: 1.5rem;
	}
}
</style>

<style scoped>
@reference "@/assets/main.css";

.router-link-active {
	color: var(--color-primary-600);
}
.dark .router-link-active {
	color: var(--color-primary-400);
}
.logo-link.router-link-active,
.logo-link.router-link-exact-active,
.dark .logo-link.router-link-active,
.dark .logo-link.router-link-exact-active {
	color: inherit !important;
}

</style>
