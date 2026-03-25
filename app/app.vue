<template>
	<UApp>
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</UApp>
</template>

<script setup lang="ts">
import { buildAbsoluteSiteUrl } from "~/utils/seo";

const i18n = useI18n();
const runtimeConfig = useRuntimeConfig();
const siteUrl = runtimeConfig.public.SITE_URL;
const defaultTitle = "Résidence Beausoleil";
const defaultDescription = "Mediterrane Ruhe, Gemeinschaft und gut gepflegte Ferienhäuser auf der Halbinsel Giens.";
const defaultImage = buildAbsoluteSiteUrl("/photos/giens-hauser.jpeg", siteUrl);
const activeLocale = computed(() => i18n.locale?.value || "de");

useHead(() => ({
	htmlAttrs: {
		lang: activeLocale.value,
	},
	link: [
		{
			rel: "icon",
			type: "image/svg+xml",
			href: "/favicon.svg",
		},
		{
			rel: "alternate icon",
			href: "/favicon.ico",
		},
	],
}));

useSeoMeta({
	titleTemplate: (titleChunk) => titleChunk ? `${titleChunk} | ${defaultTitle}` : defaultTitle,
	title: defaultTitle,
	description: defaultDescription,
	ogSiteName: defaultTitle,
	ogTitle: defaultTitle,
	ogDescription: defaultDescription,
	ogType: "website",
	ogLocale: () => activeLocale.value,
	ogUrl: siteUrl,
	ogImage: defaultImage,
	twitterCard: "summary_large_image",
	twitterTitle: defaultTitle,
	twitterDescription: defaultDescription,
	twitterImage: defaultImage,
});
</script>
