<script lang="ts" setup>
import type { SearchResult } from "../../utils/search";
import { buildMobileMenuSections, type MobileMenuFlags } from "../../utils/navigation";
import { sanitizeRedirectPath } from "../../utils/redirect";

// Narrower view of SearchResult (mirrors UiSearchModal's local SearchResultItem):
// dropping keywords/score sidesteps the readonly-array typing that
// useSearchData's `readonly(searchResults)` wrapper puts on those fields.
type MenuSearchResult = {
	id: string;
	label: string;
	context?: string;
	to: string;
	icon?: string;
	type: SearchResult["type"];
	usageKey: string;
};

const { open, closeMenu } = useMobileMenu();
const localePath = useLocalePath();
const route = useRoute();
const { t } = useI18n();
const nuxtApp = useNuxtApp();
const { loadDocuments, searchAll, searchResults, isLoading, isSearching, canAccessDocuments, recordSelection } = useSearchData();

const query = ref("");
const hasLoadedDocuments = ref(false);

const isAdmin = computed(() => import.meta.client ? nuxtApp.$isAdmin?.value ?? false : false);
const currentUser = computed(() => import.meta.client ? nuxtApp.$currentUser?.value ?? null : null);

const loginPath = computed(() => ({
	path: localePath("/login"),
	query: {
		redirect: sanitizeRedirectPath(route.fullPath, localePath("/")),
	},
}));

const menuFlags = computed<MobileMenuFlags>(() => ({
	isLoggedIn: !!currentUser.value,
	canAccessDocuments: canAccessDocuments.value,
	isAdmin: isAdmin.value,
}));

const sections = computed(() =>
	buildMobileMenuSections(t, localePath, route.path, menuFlags.value, loginPath.value),
);

type ResultGroup = { id: string; label: string; items: MenuSearchResult[] };

const resultGroups = computed<ResultGroup[]>(() => {
	if (!query.value.trim()) return [];

	const groups: ResultGroup[] = [];
	const results = searchResults.value;

	const pages = results.filter((result) => result.type === "page").slice(0, 6);
	if (pages.length > 0) groups.push({ id: "pages", label: t("search.sections.pages"), items: pages });

	const headings = results.filter((result) => result.type === "heading").slice(0, 5);
	if (headings.length > 0) groups.push({ id: "headings", label: t("search.sections.headings"), items: headings });

	if (canAccessDocuments.value) {
		const documents = results.filter((result) => result.type === "document").slice(0, 5);
		if (documents.length > 0) groups.push({ id: "documents", label: t("search.sections.documents"), items: documents });
	}

	const features = results.filter((result) => result.type === "feature" || result.type === "timeline").slice(0, 5);
	if (features.length > 0) groups.push({ id: "features", label: t("search.sections.information"), items: features });

	return groups;
});

const hasSearchResults = computed(() => resultGroups.value.length > 0);
const isSearchBusy = computed(() => isSearching.value || isLoading.value);

function handleNavigate(result?: MenuSearchResult) {
	if (result) recordSelection(result);
	closeMenu();
}

function handleOpen(isOpen: boolean) {
	if (!isOpen) {
		query.value = "";
		return;
	}

	if (!hasLoadedDocuments.value && canAccessDocuments.value) {
		hasLoadedDocuments.value = true;
		loadDocuments();
	}
}

watch(open, handleOpen);

watch(() => route.fullPath, () => {
	closeMenu();
});

watch(query, (value, _, onCleanup) => {
	const timer = window.setTimeout(async () => {
		await searchAll(value);
	}, 180);

	onCleanup(() => window.clearTimeout(timer));
});
</script>

<template>
	<UDrawer
		v-model:open="open"
		direction="bottom"
		:title="t('mobileMenu.title')"
		:description="t('mobileMenu.description')"
		:ui="{
			content: 'mobile-menu-content rounded-t-[1.75rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] shadow-[var(--app-shadow)] max-h-[85dvh]',
			handle: 'mt-3 mb-1 bg-[var(--app-border)]',
		}"
	>
		<template #content>
			<div class="flex min-h-0 flex-1 flex-col">
				<div class="shrink-0 px-4 pb-2 pt-1">
					<UInput
						v-model="query"
						icon="i-lucide-search"
						size="xl"
						autocomplete="off"
						:placeholder="t('mobileMenu.searchPlaceholder')"
						:ui="{ base: 'rounded-2xl border border-[var(--app-border)] bg-[color:var(--app-surface)]' }"
						class="w-full"
					/>
				</div>

				<div
					class="mobile-menu-body min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
					data-mobile-menu
				>
					<template v-if="query.trim()">
						<p v-if="isSearchBusy && !hasSearchResults" class="px-2 py-6 text-center text-sm text-[var(--app-muted)]">
							{{ t("mobileMenu.searching") }}
						</p>
						<p v-else-if="!hasSearchResults" class="px-2 py-6 text-center text-sm text-[var(--app-muted)]">
							{{ t("mobileMenu.noResults") }}
						</p>
						<section v-for="group in resultGroups" :key="group.id" class="mb-2">
							<h3 class="px-2 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">
								{{ group.label }}
							</h3>
							<NuxtLink
								v-for="item in group.items"
								:key="item.id"
								:to="localePath(item.to)"
								class="mobile-menu-row flex min-h-[2.75rem] items-center gap-3 rounded-xl px-3 py-1.5 text-[var(--app-text)] transition-colors active:bg-[color:var(--app-primary)]/10"
								@click="handleNavigate(item)"
							>
								<UIcon :name="item.icon || 'i-lucide-file'" class="h-5 w-5 shrink-0 text-[var(--app-muted)]" />
								<span class="min-w-0 flex-1">
									<span class="block truncate text-sm font-semibold">{{ item.label }}</span>
									<span v-if="item.context" class="block truncate text-xs text-[var(--app-muted)]">{{ item.context }}</span>
								</span>
							</NuxtLink>
						</section>
					</template>

					<template v-else>
						<section v-for="section in sections" :key="section.id" class="mb-2">
							<h3
								v-if="section.label"
								class="px-2 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]"
							>
								{{ section.label }}
							</h3>
							<NuxtLink
								v-for="item in section.items"
								:key="item.id"
								:to="item.to"
								class="mobile-menu-row flex min-h-[2.75rem] items-center gap-3 rounded-xl px-3 py-1.5 transition-colors active:bg-[color:var(--app-primary)]/10"
								:class="item.active ? 'text-[var(--app-primary)]' : 'text-[var(--app-text)]'"
								@click="handleNavigate()"
							>
								<UIcon :name="item.icon" class="h-5 w-5 shrink-0" :class="item.active ? 'text-[var(--app-primary)]' : 'text-[var(--app-muted)]'" />
								<span class="min-w-0 flex-1 truncate text-sm font-semibold">{{ item.label }}</span>
							</NuxtLink>
						</section>
					</template>
				</div>
			</div>
		</template>
	</UDrawer>
</template>

<style scoped>
.mobile-menu-row:active {
	transform: scale(0.99);
}
</style>
