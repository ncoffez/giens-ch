<template>
	<nav class="lg:hidden fixed bottom-3 left-3 right-3 z-50">
		<div class="app-surface rounded-[1.75rem] px-3 pt-2 pb-[calc(0.55rem+env(safe-area-inset-bottom))]">
		<div class="grid grid-cols-5 items-center gap-1">
			<NuxtLink
				v-for="item in navItems"
				:key="item.to"
				:to="item.to"
				class="flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[var(--app-muted)] transition-all duration-200"
				:class="{ 'bg-[color:var(--app-primary)]/10 text-[var(--app-primary)]': isActive(item.to.toString()) }">
				<UIcon :name="item.icon" class="w-5 h-5" />
				<span class="text-[10px] font-semibold tracking-[0.08em] text-center leading-tight">{{ item.label }}</span>
			</NuxtLink>
			<button
				class="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[1.25rem] bg-gradient-to-br from-[var(--app-primary)] to-[var(--app-accent)] text-white shadow-[0_16px_32px_rgba(36,108,122,0.28)] active:scale-95"
				aria-label="Suchen"
				@click="openSearch"
			>
				<UIcon name="i-lucide-search" class="w-5 h-5" />
				<span class="text-[10px] font-semibold tracking-[0.08em]">{{ t("nav.search") }}</span>
			</button>
		</div>
		</div>
	</nav>
</template>

<script setup lang="ts">
	const { t } = useI18n();
	const localePath = useLocalePath();
	const route = useRoute();
	const nuxtApp = useNuxtApp() as any;
	const { canAccessHomes } = useFeatureFlags();
	const { openSearch } = useSearchModal();

	function isActive(path: string): boolean {
		const currentPath = route.path;
		
		if (path === "/" || path === "/fr") {
			return currentPath === "/" || currentPath === "/fr";
		}
		
		const pathWithoutLocale = path.replace(/^\/fr/, "") || "/";
		const currentWithoutLocale = currentPath.replace(/^\/fr/, "") || "/";
		
		return currentWithoutLocale === pathWithoutLocale || currentWithoutLocale.startsWith(pathWithoutLocale + "/");
	}

	const navItems = computed(() => {
		const items = [
			{ label: t("nav.home"), icon: "i-lucide-house", to: localePath("/") },
			{ label: t("nav.organisatorisches"), icon: "i-lucide-clipboard-list", to: localePath("/organisatorisches") },
			{ label: t("nav.entdecken"), icon: "i-lucide-map", to: localePath("/entdecken") },
		];

		if (import.meta.client && (nuxtApp.$isReader?.value || nuxtApp.$isOwner?.value)) {
			items.splice(2, 0, { label: t("nav.documents"), icon: "i-lucide-folder", to: localePath("/documents") });
		} else {
			items.push({ label: t("nav.travel"), icon: "i-lucide-car", to: localePath("/travel") });
		}

		return items.slice(0, 4);
	});
</script>

<style scoped>
@reference "@/assets/main.css";

.router-link-active {
	color: var(--color-primary-600);
}
.dark .router-link-active {
	color: var(--color-primary-400);
}

</style>
