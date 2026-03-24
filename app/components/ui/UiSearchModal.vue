<script lang="ts" setup>
import type { CommandPaletteItem } from "@nuxt/ui";

const { open, closeSearch } = useSearchModal();

const localePath = useLocalePath();
const nuxtApp = useNuxtApp();
const { canAccessHomes } = useFeatureFlags();
const { loadAllData, loadDocuments, searchAll, isLoading, canAccessDocuments } = useSearchData();

const searchQuery = ref("");
const hasLoaded = ref(false);

const isOwner = computed(() => import.meta.client ? nuxtApp.$isOwner : false);
const isReader = computed(() => import.meta.client ? nuxtApp.$isReader : false);
const isAdmin = computed(() => import.meta.client ? nuxtApp.$isAdmin : false);
const currentUser = computed(() => import.meta.client ? nuxtApp.$currentUser : null);

const staticPageItems = computed(() => {
	const items: CommandPaletteItem[] = [
		{
			label: "Home",
			icon: "i-lucide-house",
			to: localePath("/"),
		},
		{
			label: "Organisatorisches",
			icon: "i-lucide-clipboard-list",
			to: localePath("/organisatorisches"),
		},
		{
			label: "Anreise",
			icon: "i-lucide-car",
			to: localePath("/travel"),
		},
		{
			label: "Über uns",
			icon: "i-lucide-info",
			to: localePath("/about"),
		},
	];

	if (isOwner.value || isReader.value) {
		items.push({
			label: "Dokumente",
			icon: "i-lucide-folder",
			to: localePath("/documents"),
		});
	}

	if (isOwner.value && canAccessHomes.value) {
		items.push({
			label: "Mein Haus",
			icon: "i-lucide-building-2",
			to: localePath("/my-homes"),
		});
	}

	if (currentUser.value) {
		items.push({
			label: "Profil",
			icon: "i-lucide-user",
			to: localePath("/profile/me"),
		});
	}

	if (isAdmin.value) {
		items.push({
			label: "Verwaltung",
			icon: "i-lucide-settings",
			to: localePath("/admin"),
		});
	}

	if (!currentUser.value) {
		items.push({
			label: "Login",
			icon: "i-lucide-log-in",
			to: localePath("/login"),
		});
	}

	return items;
});

const searchResults = computed(() => {
	const query = searchQuery.value.trim();
	if (!query) return [];
	return searchAll(query);
});

const headingItems = computed(() => {
	return searchResults.value
		.filter(r => r.type === "heading")
		.slice(0, 5)
		.map(result => ({
			label: result.label,
			icon: result.icon,
			to: localePath(result.to),
			suffix: result.context ? result.context + "..." : undefined,
		}));
});

const featureItems = computed(() => {
	return searchResults.value
		.filter(r => r.type === "feature" || r.type === "timeline")
		.slice(0, 5)
		.map(result => ({
			label: result.label,
			icon: result.icon,
			to: localePath(result.to),
			suffix: result.context ? result.context + "..." : undefined,
		}));
});

const documentItems = computed(() => {
	if (!canAccessDocuments.value) return [];
	
	return searchResults.value
		.filter(r => r.type === "document")
		.slice(0, 5)
		.map(result => ({
			label: result.label,
			icon: result.icon,
			to: localePath(result.to),
			suffix: result.context,
		}));
});

const groups = computed(() => {
	const result = [];

	if (staticPageItems.value.length > 0) {
		result.push({
			id: "pages",
			label: "Seiten",
			items: staticPageItems.value,
		});
	}

	if (headingItems.value.length > 0) {
		result.push({
			id: "headings",
			label: "Überschriften",
			items: headingItems.value,
		});
	}

	if (featureItems.value.length > 0) {
		result.push({
			id: "features",
			label: "Informationen",
			items: featureItems.value,
		});
	}

	if (documentItems.value.length > 0) {
		result.push({
			id: "documents",
			label: "Dokumente",
			items: documentItems.value,
		});
	}

	return result;
});

function onSelect() {
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
	const handleKeyDown = (e: KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.key === "k") {
			e.preventDefault();
			open.value = !open.value;
		}
		if (e.key === "Escape" && open.value) {
			closeSearch();
		}
	};
	window.addEventListener("keydown", handleKeyDown);
	onUnmounted(() => window.removeEventListener("keydown", handleKeyDown));
});
</script>

<template>
	<UModal v-model:open="open" title="Suchen">
		<template #content>
			<UCommandPalette
				v-model:search-term="searchQuery"
				:groups="groups"
				placeholder="Seiten, Überschriften und Dokumente durchsuchen..."
				class="h-80"
				close
				:loading="isLoading"
				@update:model-value="onSelect"
				@update:open="open = $event" />
		</template>
	</UModal>
</template>
