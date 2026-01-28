<template>
	<nav class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 pb-safe">
		<div class="flex items-center justify-around h-16 px-4">
			<NuxtLink
				v-for="item in navItems"
				:key="item.to"
				:to="item.to"
				class="flex flex-col items-center justify-center flex-1 gap-1 text-gray-500 dark:text-gray-400 transition-colors duration-200"
				:class="{ 'text-primary-600 dark:text-primary-400': item.to === '/' ? $route.path === '/' : $route.path.startsWith(item.to) }">
				<UIcon :name="item.icon" class="w-6 h-6" />
				<span class="text-[10px] font-bold uppercase tracking-wider">{{ item.label }}</span>
			</NuxtLink>
		</div>
	</nav>
</template>

<script setup lang="ts">
	const nuxtApp = useNuxtApp() as any;

	const navItems = computed(() => {
		const items = [
			{ label: "Home", icon: "i-lucide-house", to: "/" },
			{ label: "News", icon: "i-lucide-newspaper", to: "/news" },
		];

		if (import.meta.client && nuxtApp.$isReader?.value) {
			items.push({ label: "EV", icon: "i-lucide-handshake", to: "/news/eigentuemerversammlung" });
		}

		if (import.meta.client && nuxtApp.$isOwner?.value) {
			items.push({ label: "Haus", icon: "i-lucide-building-2", to: "/homes" });
		}

		if (import.meta.client && nuxtApp.$currentUser?.value) {
			items.push({ label: "Profil", icon: "i-lucide-circle-user", to: "/profile" });
		} else {
			items.push({ label: "Anmelden", icon: "i-lucide-log-in", to: "/login" });
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
