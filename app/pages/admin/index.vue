<script setup lang="ts">
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
	<div>Redirecting...</div>
</template>
