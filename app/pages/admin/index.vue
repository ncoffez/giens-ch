<script setup lang="ts">
// Stable redirect for nested parent
definePageMeta({
	middleware: [
		function (to) {
			if (to.path === '/admin') {
				return navigateTo('/admin/users')
			}
		},
	],
});
</script>
<template>
	<div></div>
</template>
