<template>
	<UApp>
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
		<ClientOnly>
			<UiErrorReportCenter />
		</ClientOnly>
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
		// SVG first: modern browsers prefer it and it stays crisp at any size.
		// The dark variant flips the palette so the mark stays legible on dark browser chrome.
		{
			rel: "icon",
			type: "image/svg+xml",
			href: "/favicon.svg",
			media: "(prefers-color-scheme: light)",
		},
		{
			rel: "icon",
			type: "image/svg+xml",
			href: "/favicon-dark.svg",
			media: "(prefers-color-scheme: dark)",
		},
		// PNG fallback for browsers that ignore SVG icons.
		{ rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
		{ rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" },
		// Multi-resolution ICO (16/32/48) for legacy and for the Windows taskbar.
		{ rel: "alternate icon", href: "/favicon.ico" },
		// iOS home screen. Square by design: iOS applies its own rounded mask.
		{ rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
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
