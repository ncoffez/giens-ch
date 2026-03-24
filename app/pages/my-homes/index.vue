<script setup lang="ts">
definePageMeta({ middleware: ["is-logged-in"] });

import type { Home } from "~/types";

const { waitForAuth, token } = useAuthReady();
const toast = useToast();
const localePath = useLocalePath();

const homes = ref<Home[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchHomes = async () => {
	try {
		await waitForAuth();
		loading.value = true;
		error.value = null;
		console.log("[my-homes] Fetching homes...");

		homes.value = await $fetch("/api/my-homes", {
			headers: { Authorization: `Bearer ${token.value}` },
		});

		console.log("[my-homes] Fetched", homes.value.length, "homes");
	} catch (e: unknown) {
		console.error("[my-homes] Error fetching homes:", e);
		error.value = getFetchError(e) || "Fehler beim Laden";
	} finally {
		loading.value = false;
	}
};

onMounted(fetchHomes);
</script>

<template>
	<div class="min-h-screen bg-stone-50 dark:bg-stone-900">
		<div class="max-w-screen-xl mx-auto px-4 py-8">
			<div class="flex items-center gap-4 mb-8">
				<UButton
					variant="ghost"
					color="neutral"
					icon="i-lucide-arrow-left"
					@click="navigateTo(localePath('/'))"
				/>
				<div>
					<h1 class="text-2xl md:text-3xl font-black">Meine Häuser</h1>
					<p class="text-stone-500 text-sm">Verwalten Sie Ihre Häuser und teilen Sie Links mit Mietern</p>
				</div>
			</div>

			<div v-if="loading" class="flex items-center justify-center py-20">
				<div class="text-center space-y-4">
					<div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
					<p class="text-stone-500">Laden...</p>
				</div>
			</div>

			<div v-else-if="error" class="text-center py-20">
				<div class="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
					<UIcon name="i-lucide-alert-circle" class="w-8 h-8 text-red-500" />
				</div>
				<p class="text-red-600 font-medium mb-4">{{ error }}</p>
				<UButton color="neutral" variant="soft" @click="fetchHomes">Erneut versuchen</UButton>
			</div>

			<div v-else-if="homes.length === 0" class="text-center py-20">
				<div class="w-16 h-16 mx-auto rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
					<UIcon name="i-lucide-home" class="w-8 h-8 text-stone-400" />
				</div>
				<p class="text-stone-500 font-medium mb-2">Keine Häuser gefunden</p>
				<p class="text-sm text-stone-400">Sie wurden noch keinem Haus zugewiesen.</p>
			</div>

			<div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<NuxtLink
					v-for="home in homes"
					:key="home.id"
					:to="`/homes/${home.id}/edit`"
					class="group bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6 hover:border-primary hover:shadow-lg transition-all"
				>
					<div class="flex items-start justify-between mb-4">
						<div class="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
							<UIcon name="i-lucide-home" class="w-6 h-6 text-primary" />
						</div>
						<UIcon name="i-lucide-arrow-right" class="w-5 h-5 text-stone-300 group-hover:text-primary transition-colors" />
					</div>

					<h2 class="text-xl font-bold mb-2">{{ home.name }}</h2>

					<div class="flex items-center gap-4 text-sm text-stone-500">
						<span class="flex items-center gap-1">
							<UIcon name="i-lucide-image" class="w-4 h-4" />
							{{ home.photos?.length || 0 }}
						</span>
						<span class="flex items-center gap-1">
							<UIcon name="i-lucide-file" class="w-4 h-4" />
							{{ home.files?.length || 0 }}
						</span>
						<span v-if="home.wifiPassword" class="flex items-center gap-1">
							<UIcon name="i-lucide-wifi" class="w-4 h-4" />
						</span>
						<span v-if="home.instructions" class="flex items-center gap-1">
							<UIcon name="i-lucide-file-text" class="w-4 h-4" />
						</span>
					</div>

					<p class="text-xs text-stone-400 mt-4">
						Erstellt: {{ new Date(home.createdAt).toLocaleDateString("de-CH") }}
					</p>
				</NuxtLink>
			</div>
		</div>
	</div>
</template>
