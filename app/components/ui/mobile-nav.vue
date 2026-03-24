<template>
	<nav class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-stone-100 dark:border-stone-800 pb-safe">
		<div class="flex items-center justify-around h-16 px-4">
			<NuxtLink
				v-for="item in navItems"
				:key="item.to"
				:to="item.to"
				class="flex flex-col items-center justify-center flex-1 gap-1 text-stone-500 dark:text-stone-400 transition-colors duration-200"
				:class="{ 'text-primary-600 dark:text-primary-400': isActive(item.to.toString()) }">
				<UIcon :name="item.icon" class="w-6 h-6" />
				<span class="text-[10px] font-bold uppercase tracking-wider">{{ item.label }}</span>
			</NuxtLink>
		</div>
	</nav>
</template>

<script setup lang="ts">
	const { t } = useI18n();
	const localePath = useLocalePath();
	const route = useRoute();
	const nuxtApp = useNuxtApp() as any;
	const { canAccessHomes } = useFeatureFlags();

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
