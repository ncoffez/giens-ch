<script setup lang="ts">
definePageMeta({ middleware: "is-admin" });
</script>

<template>
	<div class="mb-4 mt-20 max-w-screen-md mx-auto">
		<h1 class="prose">Users</h1>
		<AdminUsers />
		<h1 class="prose">Labels</h1>
		<AdminLabels />
	</div>
</template>
