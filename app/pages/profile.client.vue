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
	<div class="max-w-screen-md mx-auto w-full px-4 py-12">
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
							<h1 class="text-4xl font-extrabold tracking-tight">{{ $currentUser.displayName || 'Hausbewohner' }}</h1>
							<p class="text-xl text-gray-500 mt-1 font-medium">{{ $currentUser.email }}</p>
						</div>

						<div class="flex flex-wrap justify-center md:justify-start gap-4">
							<UBadge v-for="stat in stats" :key="stat.label" color="neutral" variant="subtle" size="lg" class="rounded-full px-4 py-1">
								<span class="text-gray-400 mr-2 text-sm">{{ stat.label }}:</span>
								<span class="font-bold text-lg">{{ stat.value }}</span>
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
								<UIcon name="i-lucide-user" class="w-6 h-6 text-primary" />
								<h3 class="text-xl font-bold">Account Informationen</h3>
							</div>
						</template>
						<div class="space-y-6">
							<div v-for="item in accountDetails" :key="item.label" class="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
								<div class="flex items-center gap-3 text-gray-500">
									<UIcon :name="item.icon" class="w-5 h-5" />
									<span class="text-lg font-medium">{{ item.label }}</span>
								</div>
								<span class="text-lg font-bold truncate max-w-[200px]">{{ item.value }}</span>
							</div>
						</div>
					</UCard>

					<!-- Actions -->
					<UCard class="rounded-2xl shadow-sm border-gray-100 dark:border-gray-800">
						<template #header>
							<div class="flex items-center gap-3">
								<UIcon name="i-lucide-shield-check" class="w-6 h-6 text-primary" />
								<h3 class="text-xl font-bold">Sicherheit & Einstellungen</h3>
							</div>
						</template>
						<div class="space-y-4">
							<UButton 
								block 
								size="xl"
								variant="outline" 
								color="neutral" 
								icon="i-lucide-key-round" 
								label="Passwort ändern" />
							<UButton 
								block 
								size="xl"
								variant="outline" 
								color="neutral" 
								icon="i-lucide-bell" 
								label="Benachrichtigungen" />
							<USeparator class="my-4" />
							<NuxtLink to="/logout" class="block w-full">
								<UButton 
									block 
									size="xl"
									variant="ghost" 
									color="error" 
									icon="i-lucide-log-out" 
									label="Vom Konto abmelden" />
							</NuxtLink>
						</div>
					</UCard>
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
