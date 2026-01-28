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
	title: "Gard du Giens - Haus am Mittelmeer",
	meta: [
			{
				name: "description",
				content: "Entdecken Sie das charmante Haus am Gard du Giens im Süden Frankreichs. Ein perfekter Ferienort für unforgettable Erinnerungen."
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
