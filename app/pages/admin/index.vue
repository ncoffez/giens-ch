<script setup lang="ts">
// Stable redirect for nested parent
const localePath = useLocalePath();

definePageMeta({
	middleware: [
		function (to) {
			if (to.path === '/admin' || to.path === '/fr/admin') {
				return navigateTo(useLocalePath()('/admin/users'));
			}
		},
	],
});
</script>
<template>
	<div></div>
</template>
