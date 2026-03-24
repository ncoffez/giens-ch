<script lang="ts" setup>
import type { CommandPaletteItem } from "@nuxt/ui";

const { open, closeSearch } = useSearchModal();
const localePath = useLocalePath();
const nuxtApp = useNuxtApp();
const { t } = useI18n();
const { canAccessHomes } = useFeatureFlags();
const { loadAllData, loadDocuments, searchAll, getRecommendations, getHeadingsByPagePath, recordSelection, isLoading, canAccessDocuments, canAccessOwnerDocuments } = useSearchData();

const searchQuery = ref("");
const hasLoaded = ref(false);

const isOwner = computed(() => import.meta.client ? nuxtApp.$isOwner?.value ?? false : false);
const isReader = computed(() => import.meta.client ? nuxtApp.$isReader?.value ?? false : false);
const isAdmin = computed(() => import.meta.client ? nuxtApp.$isAdmin?.value ?? false : false);
const currentUser = computed(() => import.meta.client ? nuxtApp.$currentUser?.value ?? null : null);

type SearchResultItem = {
	id: string;
	label: string;
	context?: string;
	to: string;
	icon?: string;
	type: "page" | "heading" | "feature" | "timeline" | "document";
	usageKey: string;
};

type SearchPaletteItem = CommandPaletteItem & {
	searchResult?: SearchResultItem;
};

const staticPageItems = computed<SearchPaletteItem[]>(() => {
	const items: SearchPaletteItem[] = [
		{
			label: t("nav.home"),
			icon: "i-lucide-house",
			to: localePath("/"),
			searchResult: {
				id: "page-home",
				label: t("nav.home"),
				to: "/",
				icon: "i-lucide-house",
				type: "page",
				usageKey: "page:/",
			},
		},
		{
			label: t("nav.organisatorisches"),
			icon: "i-lucide-clipboard-list",
			to: localePath("/organisatorisches"),
			searchResult: {
				id: "page-organisatorisches",
				label: t("nav.organisatorisches"),
				to: "/organisatorisches",
				icon: "i-lucide-clipboard-list",
				type: "page",
				usageKey: "page:/organisatorisches",
			},
		},
		{
			label: t("nav.travel"),
			icon: "i-lucide-car",
			to: localePath("/travel"),
			searchResult: {
				id: "page-travel",
				label: t("nav.travel"),
				to: "/travel",
				icon: "i-lucide-car",
				type: "page",
				usageKey: "page:/travel",
			},
		},
		{
			label: t("nav.entdecken"),
			icon: "i-lucide-map",
			to: localePath("/entdecken"),
			searchResult: {
				id: "page-entdecken",
				label: t("nav.entdecken"),
				to: "/entdecken",
				icon: "i-lucide-map",
				type: "page",
				usageKey: "page:/entdecken",
			},
		},
	];

	if (canAccessDocuments.value) {
		items.push({
			label: t("nav.documents"),
			icon: "i-lucide-folder",
			to: localePath("/documents"),
			searchResult: {
				id: "page-documents",
				label: t("nav.documents"),
				to: "/documents",
				icon: "i-lucide-folder",
				type: "page",
				usageKey: "page:/documents",
			},
		});
	}

	if (canAccessOwnerDocuments.value) {
		items.push({
			label: t("ownerDocuments.title"),
			icon: "i-lucide-files",
			to: localePath("/owner/documents"),
			searchResult: {
				id: "page-owner-documents",
				label: t("ownerDocuments.title"),
				to: "/owner/documents",
				icon: "i-lucide-files",
				type: "page",
				usageKey: "page:/owner/documents",
			},
		});
	}

	if (isOwner.value && canAccessHomes.value) {
		items.push({
			label: t("nav.myHomes"),
			icon: "i-lucide-building-2",
			to: localePath("/my-homes"),
			searchResult: {
				id: "page-my-homes",
				label: t("nav.myHomes"),
				to: "/my-homes",
				icon: "i-lucide-building-2",
				type: "page",
				usageKey: "page:/my-homes",
			},
		});
	}

	if (currentUser.value) {
		items.push({
			label: t("nav.profile"),
			icon: "i-lucide-user",
			to: localePath("/profile/me"),
			searchResult: {
				id: "page-profile",
				label: t("nav.profile"),
				to: "/profile/me",
				icon: "i-lucide-user",
				type: "page",
				usageKey: "page:/profile/me",
			},
		});
	}

	if (isAdmin.value) {
		items.push({
			label: t("nav.admin"),
			icon: "i-lucide-settings",
			to: localePath("/admin"),
			searchResult: {
				id: "page-admin",
				label: t("nav.admin"),
				to: "/admin",
				icon: "i-lucide-settings",
				type: "page",
				usageKey: "page:/admin",
			},
		});
	}

	if (!currentUser.value) {
		items.push({
			label: t("nav.login"),
			icon: "i-lucide-log-in",
			to: localePath("/login"),
			searchResult: {
				id: "page-login",
				label: t("nav.login"),
				to: "/login",
				icon: "i-lucide-log-in",
				type: "page",
				usageKey: "page:/login",
			},
		});
	}

	return items;
});

const searchResults = computed(() => {
	const query = searchQuery.value.trim();
	if (!query) return [];
	return searchAll(query);
});

const recommendationItems = computed<SearchPaletteItem[]>(() => {
	return getRecommendations().map((result) => ({
		label: result.label,
		icon: result.icon,
		to: localePath(result.to),
		suffix: result.context,
		searchResult: result,
	}));
});

const headingItems = computed<SearchPaletteItem[]>(() => {
	return searchResults.value
		.filter((result) => result.type === "heading")
		.slice(0, 5)
		.map((result) => ({
			label: result.label,
			icon: result.icon,
			to: localePath(result.to),
			suffix: result.context ? result.context + "..." : undefined,
			searchResult: result,
		}));
});

const organisatorischesHeadingItems = computed<SearchPaletteItem[]>(() => {
	return getHeadingsByPagePath("/organisatorisches")
		.slice(0, 6)
		.map((result) => ({
			label: result.text,
			icon: "i-lucide-heading",
			to: localePath(`${result.pagePath}#${result.id}`),
			suffix: result.context ? result.context + "..." : undefined,
			searchResult: {
				id: result.id,
				label: result.text,
				context: result.context,
				to: `${result.pagePath}#${result.id}`,
				icon: "i-lucide-heading",
				type: "heading" as const,
				usageKey: `heading:${result.pagePath}:${result.id}`,
			},
		}));
});

const featureItems = computed<SearchPaletteItem[]>(() => {
	return searchResults.value
		.filter((result) => result.type === "feature" || result.type === "timeline")
		.slice(0, 5)
		.map((result) => ({
			label: result.label,
			icon: result.icon,
			to: localePath(result.to),
			suffix: result.context ? result.context + "..." : undefined,
			searchResult: result,
		}));
});

const documentItems = computed<SearchPaletteItem[]>(() => {
	if (!canAccessDocuments.value) return [];

	return searchResults.value
		.filter((result) => result.type === "document")
		.slice(0, 5)
		.map((result) => ({
			label: result.label,
			icon: result.icon,
			to: localePath(result.to),
			suffix: result.context,
			searchResult: result,
		}));
});

const groups = computed(() => {
	const result = [];

	if (!searchQuery.value.trim() && recommendationItems.value.length > 0) {
		result.push({
			id: "recommendations",
			label: t("search.sections.recommendations"),
			items: recommendationItems.value,
		});
	}

	if (!searchQuery.value.trim() && staticPageItems.value.length > 0) {
		result.push({
			id: "pages",
			label: t("search.sections.pages"),
			items: staticPageItems.value,
		});
	}

	if (!searchQuery.value.trim() && organisatorischesHeadingItems.value.length > 0) {
		result.push({
			id: "organisatorisches-headings",
			label: t("nav.organisatorisches"),
			items: organisatorischesHeadingItems.value,
		});
	}

	if (headingItems.value.length > 0) {
		result.push({
			id: "headings",
			label: t("search.sections.headings"),
			items: headingItems.value,
		});
	}

	if (featureItems.value.length > 0) {
		result.push({
			id: "features",
			label: t("search.sections.information"),
			items: featureItems.value,
		});
	}

	if (documentItems.value.length > 0) {
		result.push({
			id: "documents",
			label: t("search.sections.documents"),
			items: documentItems.value,
		});
	}

	return result;
});

function onSelect(item?: SearchPaletteItem) {
	if (item?.searchResult) {
		recordSelection(item.searchResult);
	}

	closeSearch();
	searchQuery.value = "";
}

async function handleOpen(isOpen: boolean) {
	if (isOpen && !hasLoaded.value) {
		hasLoaded.value = true;
		await loadAllData();
		if (canAccessDocuments.value) {
			await loadDocuments();
		}
	}
}

watch(open, handleOpen);

onMounted(() => {
	const handleKeyDown = (event: KeyboardEvent) => {
		if ((event.metaKey || event.ctrlKey) && event.key === "k") {
			event.preventDefault();
			open.value = !open.value;
		}
		if (event.key === "Escape" && open.value) {
			closeSearch();
		}
	};

	window.addEventListener("keydown", handleKeyDown);
	onUnmounted(() => window.removeEventListener("keydown", handleKeyDown));
});
</script>

<template>
	<UModal v-model:open="open" :title="t('search.title')">
		<template #content>
			<UCommandPalette
				v-model:search-term="searchQuery"
				:groups="groups"
				:placeholder="t('search.placeholder')"
				class="h-80"
				close
				:loading="isLoading"
				@update:model-value="onSelect"
				@update:open="open = $event" />
		</template>
	</UModal>
</template>
