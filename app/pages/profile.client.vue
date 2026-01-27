<script lang="ts" setup>
definePageMeta({ middleware: "is-logged-in" });
const { $currentUser, $isAdmin, $auth } = useNuxtApp();
const toast = useToast();

const isEditingName = ref(false);
const newDisplayName = ref($currentUser.value?.displayName || "");
const isPending = ref(false);

const stats = [
	{ label: "Mitglied seit", value: $currentUser.value?.metadata?.creationTime ? new Date($currentUser.value.metadata.creationTime).toLocaleDateString('de-CH', { month: 'short', year: 'numeric' }) : 'Jan 2024', icon: "i-lucide-calendar" },
	{ label: "Status", value: $isAdmin.value ? "Administrator" : "Mitglied", icon: "i-lucide-shield" }
];

const accountDetails = computed(() => [
	{ label: "E-Mail Adresse", value: $currentUser.value?.email, icon: "i-lucide-mail" },
	{ label: "Benutzer-ID", value: $currentUser.value?.uid, icon: "i-lucide-fingerprint" },
	{ label: "Letzter Login", value: $currentUser.value?.metadata?.lastSignInTime ? new Date($currentUser.value.metadata.lastSignInTime).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unbekannt', icon: "i-lucide-history" }
]);

async function updateName() {
	if (!newDisplayName.value || newDisplayName.value.trim().length < 2) return;
	
	isPending.value = true;
	try {
		await $fetch("/api/profile/update", {
			method: "POST",
			body: { displayName: newDisplayName.value }
		});
		
		// Update local state
		if ($auth.currentUser) {
			// This might not trigger a reactive update in $currentUser immediately depending on plugin impl
			// But the backend is updated. We show success and close.
			toast.add({ title: "Profil aktualisiert", description: "Ihr Name wurde erfolgreich geändert.", color: "success" });
			isEditingName.value = false;
			// Refresh page to sync all state
			window.location.reload();
		}
	} catch (e: any) {
		toast.add({ title: "Fehler", description: e.message, color: "error" });
	} finally {
		isPending.value = false;
	}
}
</script>

<template>
	<div class="max-w-screen-md mx-auto w-full px-4 py-12">
		<ClientOnly>
			<div v-if="$currentUser" class="space-y-16">
				<!-- Header Section (Inspired by Public Profile) -->
				<div class="flex flex-col items-center text-center space-y-6">
					<div class="relative group">
						<UAvatar
							:src="$currentUser.photoURL"
							size="3xl"
							:alt="$currentUser.displayName || $currentUser.email"
							class="w-32 h-32 ring-4 ring-primary/10 shadow-2xl"
							:ui="{ rounded: 'rounded-full', text: 'text-3xl font-black' }"
						/>
						<button class="absolute bottom-0 right-0 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 hover:scale-110 transition-transform">
							<UIcon name="i-lucide-camera" class="w-4 h-4 text-primary" />
						</button>
					</div>

					<div class="space-y-3">
						<div class="flex items-center justify-center gap-3">
							<h1 class="text-4xl font-black tracking-tight">{{ $currentUser.displayName || 'Bewohner' }}</h1>
							<UButton 
								icon="i-lucide-pencil" 
								variant="ghost" 
								color="neutral" 
								size="sm" 
								class="rounded-full"
								@click="isEditingName = true"
							/>
						</div>
						<p class="text-gray-500 font-medium italic">Mitglied des Lotissement Beausoleil</p>
						
						<!-- Subtle Stats Row -->
						<div class="flex items-center justify-center gap-6 pt-2">
							<div v-for="stat in stats" :key="stat.label" class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
								<UIcon :name="stat.icon" class="w-3.5 h-3.5" />
								<span>{{ stat.value }}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Settings Sections -->
				<div class="space-y-12">
					<!-- Account Info -->
					<section class="space-y-6">
						<div class="flex items-center gap-4">
							<h2 class="text-xl font-bold">Benutzerinformationen</h2>
							<div class="flex-1 h-px bg-gray-100 dark:bg-gray-800"></div>
						</div>

						<div class="bg-white/50 dark:bg-gray-900/40 backdrop-blur-sm rounded-3xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800/50 overflow-hidden">
							<div v-for="item in accountDetails" :key="item.label" class="flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
								<div class="flex items-center gap-4">
									<div class="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500">
										<UIcon :name="item.icon" class="w-5 h-5" />
									</div>
									<span class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight">{{ item.label }}</span>
								</div>
								<span class="text-base font-medium tracking-tight">{{ item.value }}</span>
							</div>
						</div>
					</section>

					<!-- Security & Actions -->
					<section class="space-y-6">
						<div class="flex items-center gap-4">
							<h2 class="text-xl font-bold">Sicherheit & Optionen</h2>
							<div class="flex-1 h-px bg-gray-100 dark:bg-gray-800"></div>
						</div>

						<div class="space-y-3">
							<!-- Primary Action -->
							<UButton
								size="lg"
								variant="outline"
								color="neutral"
								icon="i-lucide-key-round"
								label="Passwort ändern"
								block
								class="rounded-xl font-semibold"
							/>
							
							<!-- Secondary (Admin) -->
							<UButton
								v-if="$isAdmin"
								to="/admin"
								size="lg"
								color="primary"
								variant="soft"
								icon="i-lucide-settings"
								label="Systemverwaltung"
								block
								class="rounded-xl font-semibold"
							/>
							
							<!-- Separator -->
							<div class="border-t border-gray-100 dark:border-gray-800 my-4"></div>
							
							<!-- Destructive Action -->
							<UButton
								to="/logout"
								size="lg"
								variant="ghost"
								color="error"
								icon="i-lucide-log-out"
								label="Abmelden"
								block
								class="rounded-xl font-semibold"
							/>
						</div>
					</section>
				</div>

				<!-- Debug Section -->
				<div class="pt-8 opacity-20 hover:opacity-100 transition-opacity">
					<UCollapsible>
						<UButton label="Entwickler-Rohdaten" color="neutral" variant="link" size="xs" icon="i-lucide-bug" />
						<template #content>
							<pre class="text-[10px] overflow-auto p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 mt-4">{{ $currentUser }}</pre>
						</template>
					</UCollapsible>
				</div>
			</div>

			<!-- Edit Name Modal -->
			<UModal v-model:open="isEditingName" title="Name ändern">
				<template #body>
					<div class="p-8 space-y-6">
						<div class="space-y-2 text-center">
							<h3 class="text-2xl font-black tracking-tight">Name aktualisieren</h3>
							<p class="text-sm text-gray-500">Wie sollen wir Sie in der Siedlung nennen?</p>
						</div>
						
						<UFormField label="Anzeigename" size="lg" class="w-full">
							<UInput 
								v-model="newDisplayName" 
								placeholder="Ihr Name" 
								class="w-full" 
								size="xl"
								:ui="{ rounded: 'rounded-2xl' }"
								@keyup.enter="updateName"
							/>
						</UFormField>
						
						<div class="flex flex-col gap-3 pt-4">
							<UButton 
								label="Name Speichern" 
								size="xl" 
								block 
								class="rounded-2xl font-black uppercase tracking-widest" 
								:loading="isPending" 
								@click="updateName" 
							/>
							<UButton 
								color="neutral" 
								variant="ghost" 
								label="Abbrechen" 
								size="lg" 
								block 
								class="rounded-2xl font-bold"
								@click="isEditingName = false" 
							/>
						</div>
					</div>
				</template>
			</UModal>

			<template #fallback>
				<UiProfileSkeleton />
			</template>
		</ClientOnly>
	</div>
</template>

<style scoped>
@reference "@/assets/main.css";
</style>
