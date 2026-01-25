<script setup lang="ts">
definePageMeta({ middleware: "is-admin" });
</script>

<template>
	<div class="mb-20 mt-12 max-w-screen-xl mx-auto px-4 space-y-16">
		<div class="space-y-2">
			<h1 class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">Administration</h1>
			<p class="text-gray-500">Verwalten Sie Benutzerberechtigungen und Kategorien der Siedlung.</p>
		</div>
		
		<section>
			<AdminUsers />
		</section>

		<USeparator />

		<section class="max-w-screen-md">
			<AdminLabels />
		</section>
	</div>
</template>

<style scoped>
@reference "@/assets/main.css";
</style>
