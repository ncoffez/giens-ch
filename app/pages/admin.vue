<script setup lang="ts">
import { buildAdminNavigationItems } from "../utils/navigation";

definePageMeta({ middleware: "is-admin" });

const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();

const adminDestinations = computed(() =>
	buildAdminNavigationItems(t, localePath, route.path),
);

const sidebarItems = computed(() => [
	adminDestinations.value.map((item) => ({
		label: item.label,
		icon: item.icon,
		to: item.to,
	})),
	[
		{
			label: t("admin.nav.back"),
			icon: "i-lucide-arrow-left",
			to: localePath("/"),
		},
	],
]);
</script>

<template>
	<div class="mb-20 mt-6 max-w-screen-2xl mx-auto px-4">
		<nav
			class="admin-mobile-nav lg:hidden sticky top-2 z-30 -mx-1 mb-4 overflow-x-auto"
			data-admin-mobile-nav
			:aria-label="t('admin.layout.title')"
		>
			<div class="flex w-max gap-1.5 pb-1">
				<NuxtLink
					v-for="item in adminDestinations"
					:key="item.id"
					:to="item.to"
					class="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold transition-colors"
					:class="item.active
						? 'border-[var(--app-primary)] bg-[color:var(--app-primary)]/10 text-[var(--app-primary)]'
						: 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]'"
				>
					<UIcon :name="item.icon" class="h-4 w-4" />
					{{ item.label }}
				</NuxtLink>
			</div>
		</nav>

		<div class="flex flex-col lg:flex-row gap-6 lg:gap-10">
			<aside class="hidden lg:block w-72 shrink-0">
				<div class="lg:sticky lg:top-24 space-y-5">
					<div class="rounded-[1.5rem] bg-gradient-to-br from-[var(--app-primary)]/12 to-[var(--app-accent)]/10 border border-[var(--app-border)] px-5 py-5">
						<p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)] mb-3">{{ t("admin.layout.kicker") }}</p>
						<h1 class="display-copy text-3xl font-bold tracking-[-0.04em]">{{ t("admin.layout.title") }}</h1>
						<p class="text-sm app-muted mt-2">{{ t("admin.layout.lead") }}</p>
					</div>

					<div class="rounded-[1.25rem] border border-stone-200/70 bg-stone-50/80 p-2 dark:border-stone-800 dark:bg-stone-900/50 lg:rounded-[1.5rem] lg:border-[var(--app-border)] lg:bg-[var(--app-surface)] lg:p-3 lg:shadow-[var(--app-shadow)] lg:backdrop-blur-[20px]">
						<UNavigationMenu
							:items="sidebarItems"
							orientation="vertical"
							class="w-full" />
					</div>
				</div>
			</aside>

			<main class="flex-1 min-w-0">
				<NuxtPage />
			</main>
		</div>
	</div>
</template>

<style scoped>
@reference "@/assets/main.css";

.admin-mobile-nav {
	scrollbar-width: none;
	-ms-overflow-style: none;
}

.admin-mobile-nav::-webkit-scrollbar {
	display: none;
}
</style>
