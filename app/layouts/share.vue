<template>
	<div class="app-shell mx-auto min-h-screen px-3 md:px-6">
		<header class="mx-auto flex w-full max-w-screen-lg items-center justify-between gap-4 py-4">
			<NuxtLink :to="localePath('/')" class="logo-link shrink-0">
				<UiLogo class="m-0!" />
			</NuxtLink>
			<UiLanguageSwitcher />
		</header>
		<main id="main-content" class="mx-auto w-full max-w-screen-lg pb-10">
			<slot />
		</main>
	</div>
</template>

<script setup lang="ts">
const localePath = useLocalePath();
</script>

<style scoped>
.logo-link.router-link-active,
.logo-link.router-link-exact-active,
.dark .logo-link.router-link-active,
.dark .logo-link.router-link-exact-active {
	color: inherit !important;
}
</style>
