<script setup lang="ts">
import type { Home, HomeShare, HomeContact } from "~/types";
import HomeShareView from "~/components/homes/HomeShareView.vue";
import { buildAbsoluteSiteUrl } from "~/utils/seo";
import { openAfterAsyncNavigation } from "~/utils/openSignedFile";

const route = useRoute();
const runtimeConfig = useRuntimeConfig();
const token = computed(() => route.params.token as string);
const { data, pending: loading, error } = await useAsyncData(
	() => `home-share-${token.value}`,
	() => $fetch<{ home: Home; share: HomeShare; contacts: HomeContact[] }>(`/api/homes/share/${token.value}`),
);
const home = computed(() => data.value?.home || null);
const contacts = computed(() => data.value?.contacts || []);
const errorMessage = computed(() => getFetchError(error.value) || "Fehler beim Laden");
const siteUrl = runtimeConfig.public.SITE_URL;
const defaultShareImage = buildAbsoluteSiteUrl("/photos/giens-hauser.jpeg", siteUrl);
const shareImage = computed(() => {
	const firstPhoto = home.value?.photos?.[0];
	return firstPhoto
		? buildAbsoluteSiteUrl(firstPhoto, siteUrl)
		: defaultShareImage;
});
const shareTitle = computed(() => home.value ? `${home.value.name} | Résidence Beausoleil` : "Résidence Beausoleil");
const shareDescription = computed(() => {
	if (!home.value) {
		return "Gastzugang zur Résidence Beausoleil auf der Halbinsel Giens.";
	}

	return `${home.value.name}: Kontakte, Hinweise, WLAN und wichtige Unterlagen für einen entspannten Aufenthalt am Meer.`;
});

const downloadFile = async (fileId: string) => {
	await openAfterAsyncNavigation(async () => {
		const response = await $fetch<{ url: string }>(`/api/homes/share/${token.value}/files/download`, {
			query: { fileId },
		});

		return response.url;
	});
};

useSeoMeta({
	title: () => shareTitle.value,
	description: () => shareDescription.value,
	ogTitle: () => shareTitle.value,
	ogDescription: () => shareDescription.value,
	ogType: "website",
	ogImage: () => shareImage.value,
	ogUrl: () => buildAbsoluteSiteUrl(route.fullPath || `/homes/share/${token.value}`, siteUrl),
	twitterCard: "summary_large_image",
	twitterTitle: () => shareTitle.value,
	twitterDescription: () => shareDescription.value,
	twitterImage: () => shareImage.value,
});

useHead(() => ({
	title: shareTitle.value,
	meta: [
		{
			name: "robots",
			content: "noindex, nofollow",
		},
	],
}));
</script>

<template>
	<div class="min-h-screen">
		<!-- Loading -->
		<div v-if="loading" class="flex items-center justify-center min-h-screen">
			<div class="text-center space-y-4">
				<div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
				<p class="text-stone-500">Laden...</p>
			</div>
		</div>

		<!-- Error -->
		<div v-else-if="error" class="flex items-center justify-center min-h-screen p-4">
			<div class="app-card text-center max-w-md rounded-[2rem] p-8">
				<div class="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
					<UIcon name="i-lucide-link-off" class="w-10 h-10 text-red-500" />
				</div>
				<h1 class="display-copy text-3xl font-bold mb-2">Link nicht verfügbar</h1>
				<p class="app-muted mb-6">{{ errorMessage }}</p>
				<p class="text-sm app-muted">Der Freigabelink ist möglicherweise abgelaufen oder wurde widerrufen.</p>
			</div>
		</div>

		<!-- Content -->
		<HomeShareView
			v-else-if="home"
			:home="home"
			:contacts="contacts"
			:download-file="downloadFile"
		/>
	</div>
</template>
