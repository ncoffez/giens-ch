<template>
	<div class="mx-auto md:px-8 px-4 min-h-screen flex flex-col">
		<!-- Navigation Header -->
		<header class="flex items-center justify-between py-4 md:py-6 max-w-screen-xl mx-auto w-full">
			<div class="flex items-center gap-8">
				<NuxtLink to="/">
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
						<UiSearchModal />
					</div>

					<UDropdownMenu
						:items="languageItems"
						:ui="{ content: 'w-24' }">
						<UButton
							color="neutral"
							variant="ghost"
							class="rounded-full font-bold px-2 md:px-3">
							DE
						</UButton>
					</UDropdownMenu>

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
								to="/login"
								label="Anmelden"
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

		<!-- Main Content -->
		<main class="flex-1 my-4 md:my-6 mb-24 md:mb-20 mx-auto w-full max-w-screen-xl">
			<slot />
		</main>

		<!-- Mobile Navigation -->
		<ClientOnly>
			<UiMobileNav />
		</ClientOnly>

		<!-- Footer -->
		<footer class="py-12 border-t border-stone-100 dark:border-stone-800">
			<div class="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-stone-500">
				<p>© {{ new Date().getFullYear() }} Lotissement Beausoleil, Giens</p>
			</div>
		</footer>
	</div>
</template>

<script lang="ts" setup>
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();
const nuxtApp = useNuxtApp();
	const colorMode = useColorMode();
const { canAccessHomes, fetchSettings, fetchUserPreference } = useFeatureFlags();

const currentUser = computed(() => import.meta.client ? nuxtApp.$currentUser : null);
const isAdmin = computed(() => import.meta.client ? nuxtApp.$isAdmin : false);
const isOwner = computed(() => import.meta.client ? nuxtApp.$isOwner : false);
const isPublisher = computed(() => import.meta.client ? nuxtApp.$isPublisher : false);
const isReader = computed(() => import.meta.client ? nuxtApp.$isReader : false);

onMounted(async () => {
	await fetchSettings();
	await fetchUserPreference();
});

const isDark = computed({
	get() {
		return colorMode.value === "dark";
	},
	set() {
		colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
	},
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

const languageItems = [
	[
		{
			label: "Deutsch",
			slot: "de",
			disabled: false,
		},
		{
			label: "Français",
			slot: "fr",
			disabled: true,
		},
	],
];

const publicNavigationItems = computed<NavigationMenuItem[]>(() => [
	{
		label: "Home",
		icon: "i-lucide-house",
		to: "/",
		active: route.path === "/",
	},
	{
		label: "Aktuelles",
		icon: "i-lucide-newspaper",
		active: route.path.startsWith("/news"),
		children: [
			{
				label: "News Feed",
				to: "/news",
				icon: "i-lucide-layout-list",
				description: "Alle Neuigkeiten und Updates der Siedlung.",
			},
			{
				label: "Veranstaltungen",
				to: "/news/events",
				icon: "i-lucide-party-popper",
				description: "Was läuft in Giens und Umgebung?",
			},
			{
				label: "Markt",
				to: "/news/markt",
				icon: "i-lucide-store",
				description: "Wann und wo sind die besten Märkte?",
			},
		],
	},
	{
		label: "Anreise",
		to: "/travel",
		icon: "i-lucide-car",
		active: route.path === "/travel",
	},
	{
		label: "Über uns",
		to: "/about",
		icon: "i-lucide-info",
		active: route.path === "/about",
	},
]);

const navigationItems = computed<NavigationMenuItem[]>(() => {
	const items: NavigationMenuItem[] = [
		{
			label: "Home",
			icon: "i-lucide-house",
			to: "/",
			active: route.path === "/",
		},
		{
			label: "News",
			icon: "i-lucide-newspaper",
			to: "/news",
			active: route.path.startsWith("/news"),
		},
	];

	if (import.meta.client && (isOwner.value || isReader.value)) {
		items.push({
			label: "Dokumente",
			icon: "i-lucide-folder",
			to: "/documents",
			active: route.path.startsWith("/documents"),
		});
	}

	items.push({
		label: "Anreise",
		to: "/travel",
		icon: "i-lucide-car",
		active: route.path === "/travel",
	}, {
		label: "Über uns",
		to: "/about",
		icon: "i-lucide-info",
		active: route.path === "/about",
	});

	return items;
});

const userItems = computed(() => {
	if (!currentUser.value) {
		return [
			{
				label: "Anmelden",
				icon: "i-lucide-circle-user",
				to: "/login",
			},
		];
	}

	const items = [
		{
			label: "Mein Profil",
			to: "/profile",
			icon: "i-lucide-user",
		},
		{
			label: "Meine Häuser",
			to: "/my-homes",
			icon: "i-lucide-home",
		}
	];

	if (import.meta.client && isAdmin.value) {
		items.push({
			label: "Verwaltung",
			to: "/admin",
			icon: "i-lucide-settings",
		});
	}

	items.push(
		{
			type: "separator" as const,
		},
		{
			label: "Abmelden",
			to: "/logout",
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
