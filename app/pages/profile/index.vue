<script setup lang="ts">
const { $currentUser } = useNuxtApp();

await new Promise(resolve => setTimeout(resolve, 100));

if ($currentUser?.value) {
	navigateTo('/profile/me');
} else {
	navigateTo('/login');
}
</script>

<template>
	<div class="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900">
		<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
	</div>
</template>
