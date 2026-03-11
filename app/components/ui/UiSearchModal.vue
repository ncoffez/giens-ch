<script lang="ts" setup>
import type { CommandPaletteItem } from "@nuxt/ui";

const open = defineModel<boolean>({ default: false });

const route = useRoute();
const router = useRouter();
const nuxtApp = useNuxtApp();
const { canAccessHomes } = useFeatureFlags();
const { loadArticles, searchArticles, searchOrganisatorisches, isLoading, hasLoaded } = useSearchData();

const searchQuery = ref("");

const isOwner = computed(() => import.meta.client ? nuxtApp.$isOwner : false);
const isReader = computed(() => import.meta.client ? nuxtApp.$isReader : false);
const isAdmin = computed(() => import.meta.client ? nuxtApp.$isAdmin : false);

const navigateToAnchor = (anchor: string) => {
	if (route.path === "/") {
		const element = document.querySelector(anchor);
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		} else {
			window.location.hash = anchor;
		}
	} else {
		router.push("/" + anchor);
	}
	open.value = false;
	searchQuery.value = "";
};

const staticPageItems = computed(() => {
	const items: CommandPaletteItem[] = [
		{
			label: "Home",
			icon: "i-lucide-house",
			to: "/",
		},
		{
			label: "Aktuelles",
			icon: "i-lucide-newspaper",
			to: "/news",
		},
		{
			label: "Organisatorisches",
			icon: "i-lucide-clipboard-list",
			to: "/organisatorisches",
		},
		{
			label: "Anreise",
			icon: "i-lucide-car",
			to: "/travel",
		},
		{
			label: "Über uns",
			icon: "i-lucide-info",
			to: "/about",
		},
	];

	if (isOwner.value && canAccessHomes.value) {
		items.push({
			label: "Mein Haus",
			icon: "i-lucide-building-2",
			to: "/homes",
		});
	}

	if (isOwner.value || isReader.value) {
		items.push({
			label: "Dokumente",
			icon: "i-lucide-folder",
			to: "/documents",
		});
	}

	return items;
});

const organisatorischesItem = computed(() => {
	const query = searchQuery.value.trim();
	if (!query) return null;

	const result = searchOrganisatorisches(query);
	if (!result) return null;

	return {
		label: result.label,
		icon: "i-lucide-clipboard-list",
		to: "/organisatorisches",
		suffix: result.description.substring(0, 30) + "...",
	};
});

const articleItems = computed(() => {
	const query = searchQuery.value.trim();
	if (!query) return [];

	const results = searchArticles(query).slice(0, 8);
	
	return results.map(article => {
		const item: CommandPaletteItem = {
			label: article.title,
			icon: "i-lucide-file-text",
			to: `/article/${article.id}`,
		};
		if (article.tags?.[0]) {
			item.suffix = article.tags[0];
		}
		return item;
	});
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

	if (organisatorischesItem.value) {
		result.push({
			id: "organisatorisches",
			label: "Informationen",
			items: [organisatorischesItem.value],
		});
	}

	if (articleItems.value.length > 0) {
		result.push({
			id: "articles",
			label: "Artikel",
			items: articleItems.value,
		});
	}

	return result;
});

function onSelect() {
	open.value = false;
	searchQuery.value = "";
}

watch(open, (isOpen) => {
	if (isOpen && !hasLoaded.value) {
		loadArticles();
	}
});

onMounted(() => {
	const handleKeyDown = (e: KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.key === "k") {
			e.preventDefault();
			open.value = !open.value;
		}
		if (e.key === "Escape" && open.value) {
			open.value = false;
		}
	};
	window.addEventListener("keydown", handleKeyDown);
	onUnmounted(() => window.removeEventListener("keydown", handleKeyDown));
});
</script>

<template>
	<UModal v-model:open="open" title="Suchen">
		<UButton
			icon="i-lucide-search"
			color="neutral"
			variant="ghost"
			class="rounded-full"
			aria-label="Suchen"
			@click="open = true" />

		<template #content>
			<UCommandPalette
				v-model:search-term="searchQuery"
				:groups="groups"
				placeholder="Seiten, Artikel und Informationen durchsuchen..."
				class="h-80"
				close
				:loading="isLoading"
				@update:model-value="onSelect"
				@update:open="open = $event" />
		</template>
	</UModal>
</template>