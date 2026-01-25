<script lang="ts" setup>
definePageMeta({ middleware: "is-logged-in" });
const { $currentUser } = useNuxtApp();

// In a real app, these would be fetched from a DB or calculated
const stats = [
	{ label: "Beiträge", value: "12" },
	{ label: "Mitglied seit", value: "Jan 2024" },
	{ label: "Status", value: "Eigentümer" }
];

const accountDetails = computed(() => [
	{ label: "E-Mail", value: $currentUser.value?.email, icon: "i-lucide-mail" },
	{ label: "Benutzer-ID", value: $currentUser.value?.uid, icon: "i-lucide-fingerprint" },
	{ label: "Letzter Login", value: $currentUser.value?.metadata?.lastSignInTime ? new Date($currentUser.value.metadata.lastSignInTime).toLocaleDateString('de-CH') : 'Unbekannt', icon: "i-lucide-calendar" }
]);
</script>

<template>
	<div class="max-w-screen-xl mx-auto w-full px-4 py-12">
		<ClientOnly>
			<div v-if="$currentUser" class="space-y-8">
				<!-- Header Section -->
				<div class="flex flex-col md:flex-row items-center gap-8 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
					<div class="relative group">
						<UAvatar
							:src="$currentUser.photoURL"
							size="3xl"
							:alt="$currentUser.displayName || $currentUser.email"
							class="ring-4 ring-primary-50 dark:ring-primary-950 shadow-xl" />
						<button class="absolute bottom-0 right-0 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
							<UIcon name="i-lucide-camera" class="w-4 h-4" />
						</button>
					</div>

					<div class="flex-1 text-center md:text-left space-y-4">
						<div>
							<h1 class="text-2xl font-extrabold tracking-tight">{{ $currentUser.displayName || 'Hausbewohner' }}</h1>
							<p class="text-base text-gray-500 mt-1 font-medium">{{ $currentUser.email }}</p>
						</div>

						<div class="flex flex-wrap justify-center md:justify-start gap-4">
							<UBadge v-for="stat in stats" :key="stat.label" color="neutral" variant="subtle" size="md" class="rounded-full px-3 py-1">
								<span class="text-gray-400 mr-2 text-xs">{{ stat.label }}:</span>
								<span class="font-bold text-base">{{ stat.value }}</span>
							</UBadge>
						</div>
					</div>
				</div>

				<!-- Settings Grid -->
				<div class="grid md:grid-cols-2 gap-8">
					<!-- Account Info -->
					<UCard class="rounded-2xl shadow-sm border-gray-100 dark:border-gray-800">
						<template #header>
							<div class="flex items-center gap-3">
								<UIcon name="i-lucide-user" class="w-5 h-5 text-primary" />
								<h3 class="text-lg font-bold">Account Informationen</h3>
							</div>
						</template>
						<div class="space-y-6">
							<div v-for="item in accountDetails" :key="item.label" class="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
								<div class="flex items-center gap-3 text-gray-500 shrink-0">
									<UIcon :name="item.icon" class="w-4 h-4" />
									<span class="text-base font-medium">{{ item.label }}</span>
								</div>
								<span class="text-base font-bold text-right">{{ item.value }}</span>
							</div>
						</div>
					</UCard>

					<!-- Actions -->
					<UCard class="rounded-2xl shadow-sm border-gray-100 dark:border-gray-800">
						<template #header>
							<div class="flex items-center gap-3">
								<UIcon name="i-lucide-shield-check" class="w-5 h-5 text-primary" />
								<h3 class="text-lg font-bold">Sicherheit & Einstellungen</h3>
							</div>
						</template>
						<div class="space-y-4">
							<UButton 
								block 
								size="lg"
								variant="outline" 
								color="neutral" 
								icon="i-lucide-key-round" 
								label="Passwort ändern" />
							<UButton 
								block 
								size="lg"
								variant="outline" 
								color="neutral" 
								icon="i-lucide-bell" 
								label="Benachrichtigungen" />
							<USeparator class="my-4" />
							<NuxtLink to="/logout" class="block w-full">
								<UButton 
									block 
									size="lg"
									variant="ghost" 
									color="error" 
									icon="i-lucide-log-out" 
									label="Vom Konto abmelden" />
							</NuxtLink>
						</div>
					</UCard>
				</div>

				<!-- Debug Info -->
				<div class="pt-8 border-t border-gray-100 dark:border-gray-800">
					<UCollapsible class="flex flex-col gap-4">
						<UButton label="Debug Info (User Object)" color="neutral" variant="subtle" icon="i-lucide-bug" />
						<template #content>
							<pre class="text-xs overflow-auto p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">{{ $currentUser }}</pre>
						</template>
					</UCollapsible>
				</div>
			</div>

			<template #fallback>
				<UiProfileSkeleton />
			</template>
		</ClientOnly>
	</div>
</template>

<style scoped>
@reference "@/assets/main.css";
</style>
