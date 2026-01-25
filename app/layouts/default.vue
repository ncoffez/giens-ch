<template>
	<div class="mx-auto md:px-8 px-4 min-h-screen flex flex-col">
		<!-- Navigation Header -->
		<header class="flex items-center justify-between py-6 max-w-screen-xl mx-auto w-full">
			<div class="flex items-center gap-8">
				<NuxtLink to="/">
					<UiLogo class="m-0!" />
				</NuxtLink>
				<div class="hidden lg:block">
					<UNavigationMenu :items="navigationItems" />
				</div>
			</div>

			<div class="flex items-center gap-3">
				<ClientOnly>
					<!-- Language Switcher Placeholder -->
					<UDropdownMenu
						:items="languageItems"
						:ui="{ content: 'w-24' }">
						<UButton
							color="neutral"
							variant="ghost"
							class="rounded-full font-bold">
							DE
						</UButton>
					</UDropdownMenu>

					<UButton
						:icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
						color="neutral"
						variant="ghost"
						class="rounded-full"
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
				</ClientOnly>

				<!-- Mobile Menu Trigger -->
				<div class="lg:hidden">
					<UDrawer direction="right" title="Navigation">
						<UButton color="neutral" variant="ghost" icon="i-lucide-menu" size="xl" />
						<template #content>
							<div class="p-6 h-full flex flex-col">
								<div class="flex items-center justify-between mb-8">
									<UiLogo />
								</div>
								<div class="flex-1 overflow-y-auto space-y-6">
									<UNavigationMenu :items="navigationItems" orientation="vertical" />
									<USeparator />
									<UNavigationMenu :items="userItems" orientation="vertical" />
								</div>
							</div>
						</template>
					</UDrawer>
				</div>
			</div>
		</header>

		<!-- Main Content -->
		<main class="flex-1 my-6 mb-20 mx-auto w-full">
			<slot />
		</main>

		<!-- Footer -->
		<footer class="py-12 border-t border-gray-100 dark:border-gray-800">
			<div class="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
				<p>© {{ new Date().getFullYear() }} Lotissement Beausoleil, Giens</p>
				<ClientOnly v-if="$currentUser">
					<UCollapsible class="flex flex-col gap-2">
						<UButton label="Debug Info" color="neutral" variant="link" size="xs" />
						<template #content>
							<pre class="text-[10px] overflow-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg max-w-md">{{ $currentUser }}</pre>
						</template>
					</UCollapsible>
				</ClientOnly>
			</div>
		</footer>
	</div>
</template>

<script lang="ts" setup>
import type { NavigationMenuItem } from "@nuxt/ui";

const { $currentUser } = useNuxtApp();
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

const navigationItems = computed<NavigationMenuItem[]>(() => {
	const items: NavigationMenuItem[] = [
		{
			label: "Home",
			icon: "i-lucide-house",
			to: "/",
		},
		{
			label: "Aktuelles",
			icon: "i-lucide-newspaper",
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
				{
					label: "Fotos",
					icon: "i-lucide-camera",
					description: "Bildergalerien unserer Siedlung.",
					disabled: true,
				},
			],
		},
		{
			label: "Siedlung",
			icon: "i-lucide-map",
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
				{
					label: "Hausliste",
					icon: "i-lucide-home",
					description: "Übersicht aller Häuser der Siedlung.",
					disabled: true,
				},
			],
		},
	];

	if ($currentUser.value) {
		items.push({
			label: "Intern",
			icon: "i-lucide-lock",
			children: [
				{
					label: "Dokumente",
					to: "/news/documents",
					icon: "i-lucide-file-text",
					description: "Wichtige Unterlagen und Formulare.",
				},
				{
					label: "Reglemente",
					to: "/news/reglemente",
					icon: "i-lucide-scroll",
					description: "Hausordnung und Statuten.",
				},
				{
					label: "Eigentümerversammlung",
					to: "/news/eigentuemerversammlung",
					icon: "i-lucide-users-round",
					description: "Protokolle und Beschlüsse.",
				},
				{
					label: "Eigentümerliste",
					icon: "i-lucide-contact",
					description: "Kontaktdaten der Bewohner.",
					disabled: true,
				},
			],
		});
	}

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

	return [
		{
			label: "Mein Profil",
			to: "/profile",
			icon: "i-lucide-user",
		},
		{
			label: "Verwaltung",
			to: "/admin",
			icon: "i-lucide-settings",
		},
		{
			type: "separator" as const,
		},
		{
			label: "Abmelden",
			to: "/logout",
			icon: "i-lucide-log-out",
		},
	];
});
</script>

<style scoped>
@reference "@/assets/main.css";

.router-link-active {
	@apply text-primary;
}
</style>
