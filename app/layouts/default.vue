<template>
	<div class="mx-auto md:px-8 px-4">
		<div id="top-bar" class="flex flex-row my-4 max-w-screen-lg mx-auto w-full">
			<div id="logo" class="font-extrabold text-3xl leading-[1.2rem] text-start flex-grow-0 w-fit h-fit mr-8">
				<span class="font-light text-2xl">Lotissement</span><br />Beausoleil
			</div>
			<UNavigationMenu
				:items="staticNavigation"
				class="w-fit"
				:ui="{
					viewportWrapper: 'w-lg z-1',
				}" />
			<ClientOnly>
				<UNavigationMenu :items="userNavigation" content-orientation="vertical" class="w-full" :ui="{}" />
			</ClientOnly>
		</div>
		<section class="my-10 mb-20 mx-auto">
			<NuxtPage />
		</section>
	</div>
	<ClientOnly>
		<UCollapsible class="flex flex-col gap-2 max-w-screen-sm mx-auto pt-20">
			<UButton label="Show user" color="neutral" variant="subtle" class="flex w-fit mx-auto" />

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
