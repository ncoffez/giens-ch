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
	<div class="mb-20 mt-6 max-w-screen-2xl mx-auto px-4">
		<div class="app-card rounded-[2rem] p-4 md:p-6 lg:p-8">
		<div class="flex flex-col lg:flex-row gap-6 lg:gap-10">
			<!-- Sidebar -->
			<aside class="w-full lg:w-72 shrink-0">
				<div class="lg:sticky lg:top-24 space-y-5">
					<div class="rounded-[1.5rem] bg-gradient-to-br from-[var(--app-primary)]/12 to-[var(--app-accent)]/10 border border-[var(--app-border)] px-5 py-5">
						<p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)] mb-3">Kontrollzentrum</p>
						<h1 class="display-copy text-3xl font-bold tracking-[-0.04em]">Administration</h1>
						<p class="text-sm app-muted mt-2">Benutzer, Häuser, Sichtbarkeit und interne Abläufe an einem Ort.</p>
					</div>
					
					<div class="app-surface rounded-[1.5rem] p-3">
					<UNavigationMenu 
						:items="items" 
						orientation="vertical"
						class="w-full" />
					</div>
				</div>
			</aside>

			<!-- Content Area -->
			<main class="flex-1 min-w-0">
				<NuxtPage />
			</main>
		</div>
		</div>
	</div>
</template>

<style scoped>
@reference "@/assets/main.css";
</style>
