<template>
	<div class="mx-auto md:px-8 px-4">
		<!-- Desktop navigation -->
		<div id="desktop-nav" class="flex-row my-4 max-w-screen-lg mx-auto w-full hidden sm:flex">
			<UiLogo />
			<UNavigationMenu
				:items="staticNavigation"
				class="w-fit"
				:ui="{
					viewportWrapper: 'w-lg',
				}" />
			<ClientOnly>
				<UNavigationMenu :items="userNavigation" content-orientation="vertical" class="w-full" />
			</ClientOnly>
		</div>
		<!-- Mobile navigation -->
		<div id="mobile-nav" class="sm:hidden grid grid-cols-[1fr_1fr_1fr] w-full my-4">
			<UDrawer direction="left" title="Giens.ch" class="justify-self-start">
				<UButton color="neutral" variant="ghost" icon="lucide:menu" size="xl" />
				<template #content>
					<div class="p-4 w-72 flex flex-col">
						<UNavigationMenu :items="staticNavigation" orientation="vertical" :collapsible="true" class="w-full" />
						<ClientOnly>
							<UNavigationMenu :items="userNavigation" orientation="vertical" class="w-full" />
						</ClientOnly>
					</div>
				</template>
			</UDrawer>
			<UiLogo class="m-0!" />
		</div>
		<!--  -->
		<section class="my-10 mb-20 mx-auto">
			<NuxtPage />
		</section>
	</div>
	<!-- User debug in the footer -->
	<ClientOnly>
		<UCollapsible class="flex flex-col gap-2 max-w-screen-sm mx-auto py-20" v-if="$currentUser">
			<UButton label="Show user" color="neutral" variant="soft" class="flex mx-auto" />

			<template #content>
				<pre class="overflow-scroll mx-auto break-all">{{ $currentUser }}</pre>
			</template>
		</UCollapsible>
	</ClientOnly>
</template>
<script lang="ts" setup>
import type { NavigationMenuItem } from "@nuxt/ui";

const { $currentUser } = useNuxtApp();

const staticNavigation = ref<NavigationMenuItem[]>([
	{
		label: "Home",
		icon: "i-lucide-house",
		to: "/",
	},
	{
		label: "Infos",
		icon: "i-lucide-book-user",
		children: [
			{
				label: "Über uns",
				to: "/about",
				icon: "i-lucide-info",
				description: "Finde mehr über das Team hinter dem Lotissement Beausoleil heraus.",
			},
			{
				label: "Anreise",
				to: "/travel",
				icon: "i-lucide-car",
				description: "Tipps, um sorgenfrei in Giens anzukommen.",
			},
			{
				label: "Reglemente",
				icon: "i-lucide-file-text",
				description: "Regeln fürs gemeinsame Wohlbefinden.",
				disabled: true,
			},
			{
				label: "Hausliste",
				icon: "i-lucide-house",
				description: "Finde mehr Infos über ein spezifisches Haus.",
				disabled: true,
			},
			{
				label: "Eigentümer",
				icon: "fa6-regular:address-book",
				description: "Liste der aktuellen Eigentümer.",
				disabled: true,
			},
		],
	},
	{
		label: "News",
		icon: "i-lucide-newspaper",
		to: "/news",
		children: [
			{
				label: "Erstellen",
				icon: "lucide:square-pen",
				description: "Verfasse einen neuen Newsartikel.",
				to: "/news/new",
			},
			{
				label: "Eigentümerversammlung",
				icon: "i-lucide-files",
				description: "Erfahre was beschlossen wurde.",
			},
			{
				label: "Veranstaltungen",
				icon: "i-lucide-party-popper",
				description: "Wo die coolsten Events in der Nähe steigen.",
			},
			{
				label: "Markt",
				icon: "i-lucide-store",
				description: "Gemüse, Kleinkram und Souvenirs. Hier findest du die heissesten Spots.",
			},
			{
				label: "Fotos",
				icon: "i-lucide-camera",
				description: "Erinnerungen an die letzten Ferien.",
			},
		],
	},
]);
const userNavigation = computed<NavigationMenuItem[]>(() => [
	...(!$currentUser.value
		? [
				{
					label: "Einloggen",
					icon: "i-lucide-circle-user",
					to: "/login",
				},
		  ]
		: [
				{
					label: "Profile",
					icon: "i-lucide-circle-user",
					to: "/profile",
					children: [
						{
							label: "Einstellungen",
							icon: "i-lucide-cog",
							description: "Stell dein Konto ein.",
						},
						{
							label: "Administration",
							icon: "mdi:tools",
							description: "Verwalte Benutzer.",
							to: "/admin",
						},
						{
							label: "Abmelden",
							icon: "ic:outline-logout",
							description: "Melde dich ab.",
							to: "/logout",
						},
					],
				},
		  ]),
]);
</script>
<style scoped></style>
