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
					<!-- Language Switcher Placeholder -->
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

					<UButton
						:icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
						color="neutral"
						variant="ghost"
						class="rounded-full"
						:aria-label="isDark ? 'Hellmodus aktivieren' : 'Dunkelmodus aktivieren'"
						@click="isDark = !isDark" />
					<div class="hidden lg:block">
						<template v-if="!$currentUser">
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
									:label="$currentUser.displayName || 'Profil'"
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
		<UiMobileNav />

		<!-- Footer -->
		<footer class="py-12 border-t border-gray-100 dark:border-gray-800">
			<div class="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
				<p>© {{ new Date().getFullYear() }} Lotissement Beausoleil, Giens</p>
			</div>
		</footer>
	</div>
</template>

<script lang="ts" setup>
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();
const { $currentUser, $isAdmin, $isOwner, $isPublisher, $isReader } = useNuxtApp();
const colorMode = useColorMode();

const isDark = computed({
	get() {
		return colorMode.value === "dark";
	},
	set() {
		colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
	},
});

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
		label: "Siedlung",
		icon: "i-lucide-map",
		active: route.path === "/travel" || route.path === "/about",
		children: [
			{
				label: "Anreise",
				to: "/travel",
				icon: "i-lucide-car",
				description: "Tipps für eine entspannte Anreise nach Giens.",
			},
			{
				label: "Über uns",
				to: "/about",
				icon: "i-lucide-info",
				description: "Geschichte und Spirit des Lotissement Beausoleil.",
			},
		],
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
		{
			label: "Siedlung",
			icon: "i-lucide-map",
			active: route.path === "/travel" || route.path === "/about",
			children: [
				{
					label: "Anreise",
					to: "/travel",
					icon: "i-lucide-car",
					description: "Tipps für eine entspannte Anreise nach Giens.",
				},
				{
					label: "Über uns",
					to: "/about",
					icon: "i-lucide-info",
					description: "Geschichte und Spirit des Lotissement Beausoleil.",
				},
			],
		},
	];

	return items;
});

const userItems = computed(() => {
	if (!$currentUser.value) {
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
		}
	];

	if ($isAdmin.value) {
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
