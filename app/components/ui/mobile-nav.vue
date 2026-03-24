<template>
	<nav class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-stone-100 dark:border-stone-800 pb-safe">
		<div class="flex items-center justify-around h-18 px-2 py-1">
			<NuxtLink
				v-for="item in navItems"
				:key="item.to"
				:to="item.to"
				class="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 text-stone-500 dark:text-stone-400 transition-all duration-200 rounded-lg"
				:class="{ 'text-primary-600 dark:text-primary-400': isActive(item.to.toString()) }">
				<UIcon :name="item.icon" class="w-7 h-7" />
				<span class="text-[11px] font-semibold uppercase tracking-wide">{{ item.label }}</span>
			</NuxtLink>
			<button
				class="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 text-stone-500 dark:text-stone-400 transition-all duration-200 rounded-lg active:scale-95"
				aria-label="Suchen"
				@click="openSearch"
			>
				<UIcon name="i-lucide-search" class="w-7 h-7" />
				<span class="text-[11px] font-semibold uppercase tracking-wide">{{ t("nav.search") }}</span>
			</button>
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
			{ label: t("nav.travel"), icon: "i-lucide-car", to: localePath("/travel") },
			{ label: t("nav.entdecken"), icon: "i-lucide-map", to: localePath("/entdecken") },
		];

		if (import.meta.client && (nuxtApp.$isReader?.value || nuxtApp.$isOwner?.value)) {
			items.push({ label: t("nav.documents"), icon: "i-lucide-folder", to: localePath("/documents") });
		}

		if (import.meta.client && nuxtApp.$isOwner?.value && canAccessHomes.value) {
			items.push({ label: t("nav.myHomes"), icon: "i-lucide-building-2", to: localePath("/my-homes") });
		}

		if (import.meta.client && nuxtApp.$currentUser?.value) {
			items.push({ label: t("nav.profile"), icon: "i-lucide-circle-user", to: localePath("/profile") });
		} else {
			items.push({ label: t("nav.login"), icon: "i-lucide-log-in", to: localePath("/login") });
		}

		return items;
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

.pb-safe {
	padding-bottom: env(safe-area-inset-bottom);
}
</style>
