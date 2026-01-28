<template>
	<UApp>
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</UApp>
</template>

<script setup>
const { unsubscribe } = useNuxtApp();

useHead({
	htmlAttrs: {
		lang: "de"
	},
	title: "Résidence Beausoleil",
	meta: [
			{
				name: "description",
				content: "Willkommen in der Résidence Beausoleil - Ihr perfektes Feriendomizil für unvergessliche Tage am Mittelmeer."
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			}
		],
		link: [
			{
				rel: "preconnect",
				href: "https://giens-ch.web.app"
			}
		]
	});

onUnmounted(() => unsubscribe());
</script>
