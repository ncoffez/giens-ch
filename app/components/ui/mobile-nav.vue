<template>
	<nav class="mobile-nav-shell lg:hidden fixed bottom-3 left-3 right-3 z-50" data-mobile-nav>
		<div class="mobile-nav-surface app-surface rounded-[1.75rem] px-3 pt-2 pb-[calc(0.55rem+env(safe-area-inset-bottom))]">
		<div class="mobile-nav-list grid grid-cols-5 items-center gap-0.5" data-mobile-nav-list>
			<NuxtLink
				v-for="item in navItems"
				:key="item.to"
				:to="item.to"
				class="mobile-nav-item flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[var(--app-muted)] transition-all duration-200"
				:class="{ 'bg-[color:var(--app-primary)]/10 text-[var(--app-primary)]': isActive(item.to.toString()) }">
				<UIcon :name="item.icon" class="w-5 h-5" />
				<span class="mobile-nav-label max-w-full break-all text-center text-[9px] font-semibold leading-[1.05] tracking-[0.03em]">{{ item.label }}</span>
			</NuxtLink>
			<button
				class="mobile-nav-item mobile-nav-search flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-[var(--app-border)] bg-[color:var(--app-surface-strong)] px-1 py-2 text-[var(--app-text)] transition-all duration-200 active:scale-95 hover:border-[var(--app-primary)]/40 hover:text-[var(--app-primary)]"
				aria-label="Suchen"
				@click="openSearch"
			>
				<UIcon name="i-lucide-search" class="w-5 h-5" />
				<span class="mobile-nav-label max-w-full break-all text-center text-[9px] font-semibold leading-[1.05] tracking-[0.03em]">{{ t("nav.search") }}</span>
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

@media (orientation: landscape) and (max-width: 1023px) and (max-height: 640px) {
	.mobile-nav-shell {
		top: 50%;
		right: auto;
		bottom: auto;
		left: max(0.75rem, env(safe-area-inset-left));
		width: calc(4.75rem + env(safe-area-inset-left));
		transform: translateY(-50%);
	}

	.mobile-nav-surface {
		padding-top: 0.75rem;
		padding-right: 0.5rem;
		padding-bottom: 0.75rem;
		padding-left: 0.5rem;
		border-radius: 1.75rem;
	}

	.mobile-nav-list {
		grid-template-columns: 1fr;
		gap: 0.4rem;
	}

	.mobile-nav-item {
		min-height: 3.75rem;
		padding-right: 0.35rem;
		padding-left: 0.35rem;
	}

	.mobile-nav-label {
		font-size: 0.5rem;
		line-height: 1.05;
	}
}
</style>
