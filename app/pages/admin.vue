<script setup lang="ts">
definePageMeta({ middleware: "is-admin" });

const items = [
	[
		{
			label: 'Häuser',
			icon: 'i-lucide-building-2',
			to: '/admin/homes'
		},
		{
			label: 'Benutzer',
			icon: 'i-lucide-users',
			to: '/admin/users'
		},
		{
			label: 'Labels & Sichtbarkeit',
			icon: 'i-lucide-tags',
			to: '/admin/labels'
		}
	],
	[
		{
			label: 'Papierkorb',
			icon: 'i-lucide-trash-2',
			to: '/admin/trash'
		},
		{
			label: 'Einstellungen',
			icon: 'i-lucide-settings',
			to: '/admin/settings'
		},
		{
			label: 'Zurück zur Seite',
			icon: 'i-lucide-arrow-left',
			to: '/'
		}
	]
]
</script>

<template>
	<div class="mb-20 mt-12 max-w-screen-xl mx-auto px-4">
		<div class="flex flex-col lg:flex-row gap-12">
			<!-- Sidebar -->
			<aside class="w-full lg:w-64 shrink-0">
				<div class="sticky top-24 space-y-6">
					<div class="px-3">
						<h1 class="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Admin</h1>
						<p class="text-sm text-stone-500 mt-1">Verwaltung & Einstellungen</p>
					</div>
					
					<UNavigationMenu 
						:items="items" 
						orientation="vertical"
						class="w-full" />
				</div>
			</aside>

			<!-- Content Area -->
			<main class="flex-1 min-w-0">
				<NuxtPage />
			</main>
		</div>
	</div>
</template>

<style scoped>
@reference "@/assets/main.css";
</style>
