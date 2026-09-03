<template>
	<nav class="mobile-nav-shell lg:hidden fixed bottom-3 left-3 right-3 z-50" data-mobile-nav>
		<div class="mobile-nav-surface app-surface rounded-[1.75rem] px-3 pt-2 pb-[calc(0.55rem+env(safe-area-inset-bottom))]">
			<div class="mobile-nav-list grid grid-cols-4 items-center gap-0.5" data-mobile-nav-list>
			<NuxtLink
				v-for="item in tabItems"
				:key="item.label"
				:to="item.to"
				class="mobile-nav-item flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[var(--app-muted)] transition-all duration-200"
				:class="{ 'bg-[color:var(--app-primary)]/10 text-[var(--app-primary)]': isActive(String(item.to)) }">
				<UIcon :name="item.icon" class="w-5 h-5" />
				<span class="mobile-nav-label max-w-full whitespace-normal break-words text-center text-[9.5px] font-semibold leading-[1.15] tracking-[0.01em]">{{ item.label }}</span>
			</NuxtLink>
			<button
				type="button"
				data-mobile-nav-menu
				class="mobile-nav-item mobile-nav-menu flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-[var(--app-border)] bg-[color:var(--app-surface-strong)] px-1 py-2 text-[var(--app-text)] transition-all duration-200 active:scale-95 hover:border-[var(--app-primary)]/40 hover:text-[var(--app-primary)]"
				:aria-label="t('mobileMenu.openLabel')"
				aria-haspopup="dialog"
				:aria-expanded="isMenuOpen"
				@click="openMenu"
			>
				<span class="relative flex h-5 w-5 items-center justify-center">
					<img
						v-if="userPhotoUrl"
						:src="userPhotoUrl"
						:alt="userDisplayName"
						class="h-5 w-5 rounded-full object-cover ring-1 ring-[var(--app-border)]"
					/>
					<UIcon v-else name="i-lucide-menu" class="w-5 h-5" />
				</span>
				<span class="mobile-nav-label max-w-full whitespace-normal break-words text-center text-[9.5px] font-semibold leading-[1.15] tracking-[0.01em]">{{ t("nav.menu") }}</span>
			</button>
			</div>
		</div>
	</nav>
</template>

<script setup lang="ts">
	import { buildMobileTabItems } from "../../utils/navigation";

	const { t } = useI18n();
	const localePath = useLocalePath();
	const route = useRoute();
	const nuxtApp = useNuxtApp() as any;
	const { open: isMenuOpen, openMenu } = useMobileMenu();

	const currentUser = computed(() => (import.meta.client ? nuxtApp.$currentUser?.value ?? null : null));
	const userPhotoUrl = computed(() => currentUser.value?.photoURL || "");
	const userDisplayName = computed(() =>
		(currentUser.value?.displayName || currentUser.value?.email || currentUser.value?.name || currentUser.value) ?? "",
	);

	function isActive(path: string): boolean {
		const currentPath = route.path;

		if (path === "/" || path === "/fr") {
			return currentPath === "/" || currentPath === "/fr";
		}

		const pathWithoutLocale = path.replace(/^\/fr/, "") || "/";
		const currentWithoutLocale = currentPath.replace(/^\/fr/, "") || "/";

		return currentWithoutLocale === pathWithoutLocale || currentWithoutLocale.startsWith(pathWithoutLocale + "/");
	}

	const tabItems = computed(() => buildMobileTabItems(t, localePath, route.path));
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
