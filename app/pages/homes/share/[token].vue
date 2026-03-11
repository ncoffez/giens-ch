<script setup lang="ts">
import type { Home, HomeShare, HomeContact } from "~/types";
import ContactCard from "~/components/homes/ContactCard.vue";
import { getFileIcon } from "~/utils/fileTypes";

const route = useRoute();
const token = computed(() => route.params.token as string);

const home = ref<Home | null>(null);
const share = ref<HomeShare | null>(null);
const contacts = ref<HomeContact[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const activePhoto = ref(0);
const showWifiPassword = ref(false);
const ssidCopied = ref(false);
const passwordCopied = ref(false);

const fetchHome = async () => {
	try {
		loading.value = true;
		error.value = null;

		const result = await $fetch<{ home: Home; share: HomeShare; contacts: HomeContact[] }>(`/api/homes/share/${token.value}`);
		home.value = result.home;
		share.value = result.share;
		contacts.value = result.contacts || [];
	} catch (e: unknown) {
		error.value = getFetchError(e) || "Fehler beim Laden";
	} finally {
		loading.value = false;
	}
};

const copySSID = async () => {
	if (!home.value?.wifiSSID) return;
	await navigator.clipboard.writeText(home.value.wifiSSID);
	ssidCopied.value = true;
	setTimeout(() => (ssidCopied.value = false), 2000);
};

const copyPassword = async () => {
	if (!home.value?.wifiPassword) return;
	await navigator.clipboard.writeText(home.value.wifiPassword);
	passwordCopied.value = true;
	setTimeout(() => (passwordCopied.value = false), 2000);
};

const downloadFile = (url: string) => {
	window.open(url, "_blank");
};

const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

useHead(() => ({
	title: home.value ? `${home.value.name} - Giens` : "Giens",
}));

onMounted(fetchHome);
</script>

<template>
	<div class="min-h-screen bg-stone-50 dark:bg-stone-900">
		<!-- Loading -->
		<div v-if="loading" class="flex items-center justify-center min-h-screen">
			<div class="text-center space-y-4">
				<div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
				<p class="text-stone-500">Laden...</p>
			</div>
		</div>

		<!-- Error -->
		<div v-else-if="error" class="flex items-center justify-center min-h-screen p-4">
			<div class="text-center max-w-md">
				<div class="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
					<UIcon name="i-lucide-link-off" class="w-10 h-10 text-red-500" />
				</div>
				<h1 class="text-2xl font-black mb-2">Link nicht gefunden</h1>
				<p class="text-stone-500 mb-6">{{ error }}</p>
				<p class="text-sm text-stone-400">Der Link ist möglicherweise abgelaufen oder wurde widerrufen.</p>
			</div>
		</div>

		<!-- Content -->
		<template v-else-if="home">
			<div class="max-w-screen-lg mx-auto px-4 py-8 space-y-8">
				<!-- Header -->
				<div class="text-center">
					<h1 class="text-3xl md:text-4xl font-black mb-2">{{ home.name }}</h1>
					<p class="text-stone-500">Willkommen!</p>
				</div>

				<!-- Photos -->
				<section v-if="home.photos?.length" class="space-y-4">
					<div class="aspect-video rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800">
						<img
							:src="home.photos[activePhoto]"
							:alt="`${home.name} Foto ${activePhoto + 1}`"
							class="w-full h-full object-cover"
						/>
					</div>
					<div v-if="home.photos.length > 1" class="flex gap-2 overflow-x-auto pb-2">
						<button
							v-for="(photo, index) in home.photos"
							:key="index"
							@click="activePhoto = index"
							class="shrink-0 w-16 h-16 rounded-lg overflow-hidden ring-2 transition-all"
							:class="index === activePhoto ? 'ring-primary' : 'ring-transparent hover:ring-stone-300'"
						>
							<img :src="photo" :alt="`Thumbnail ${index + 1}`" class="w-full h-full object-cover" />
						</button>
					</div>
				</section>

				<!-- Contacts -->
				<section v-if="contacts.length > 0" class="space-y-4">
					<h2 class="text-lg font-bold flex items-center gap-2">
						<UIcon name="i-lucide-users" class="w-5 h-5" />
						Kontaktpersonen
					</h2>
					<div class="grid gap-4 md:grid-cols-2">
						<ContactCard
							v-for="contact in contacts"
							:key="contact.id"
							:contact="contact"
						/>
					</div>
				</section>

				<!-- WiFi -->
				<section v-if="home.wifiSSID || home.wifiPassword" class="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700">
					<div class="flex items-center gap-3 mb-4">
						<div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
							<UIcon name="i-lucide-wifi" class="w-5 h-5 text-blue-500" />
						</div>
						<h2 class="text-lg font-bold">WLAN</h2>
					</div>

					<div class="space-y-3">
						<!-- SSID -->
						<div v-if="home.wifiSSID" class="flex items-center gap-3 p-4 bg-stone-50 dark:bg-stone-900 rounded-xl">
							<div class="flex-1">
								<p class="text-xs text-stone-500 mb-1">Netzwerkname (SSID)</p>
								<code class="text-lg font-mono">{{ home.wifiSSID }}</code>
							</div>
							<UButton
								:icon="ssidCopied ? 'i-lucide-check' : 'i-lucide-copy'"
								:color="ssidCopied ? 'success' : 'neutral'"
								variant="soft"
								size="sm"
								@click="copySSID"
							>
								{{ ssidCopied ? "Kopiert" : "Kopieren" }}
							</UButton>
						</div>

						<!-- Password -->
						<div v-if="home.wifiPassword" class="flex items-center gap-3 p-4 bg-stone-50 dark:bg-stone-900 rounded-xl">
							<div class="flex-1">
								<p class="text-xs text-stone-500 mb-1">Passwort</p>
								<div class="flex items-center gap-2">
									<code class="text-lg font-mono">
										{{ showWifiPassword ? home.wifiPassword : "••••••••••" }}
									</code>
								</div>
							</div>
							<UButton
								:icon="showWifiPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
								color="neutral"
								variant="soft"
								size="sm"
								@click="showWifiPassword = !showWifiPassword"
							/>
							<UButton
								:icon="passwordCopied ? 'i-lucide-check' : 'i-lucide-copy'"
								:color="passwordCopied ? 'success' : 'neutral'"
								variant="soft"
								size="sm"
								@click="copyPassword"
							>
								{{ passwordCopied ? "Kopiert" : "Kopieren" }}
							</UButton>
						</div>
					</div>
				</section>

				<!-- Instructions -->
				<section v-if="home.instructions" class="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700">
					<div class="flex items-center gap-3 mb-4">
						<div class="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
							<UIcon name="i-lucide-file-text" class="w-5 h-5 text-green-500" />
						</div>
						<h2 class="text-lg font-bold">Anleitung</h2>
					</div>
					<div class="prose dark:prose-invert max-w-none" v-html="home.instructions" />
				</section>

				<!-- Files -->
				<section v-if="home.files?.length" class="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700">
					<div class="flex items-center gap-3 mb-4">
						<div class="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
							<UIcon name="i-lucide-folder" class="w-5 h-5 text-purple-500" />
						</div>
						<h2 class="text-lg font-bold">Dateien</h2>
					</div>
					<div class="space-y-3">
						<button
							v-for="file in home.files"
							:key="file.id"
							@click="downloadFile(file.url)"
							class="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-100 dark:border-stone-700 hover:border-primary hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all text-left"
						>
							<div class="p-2 bg-stone-50 dark:bg-stone-700 rounded-lg">
								<UIcon :name="getFileIcon(file.type)" class="w-5 h-5 text-stone-500" />
							</div>
							<div class="flex-1 min-w-0">
								<p class="font-medium truncate">{{ file.name }}</p>
								<p class="text-sm text-stone-500">{{ formatFileSize(file.size) }}</p>
							</div>
							<UIcon name="i-lucide-download" class="w-5 h-5 text-stone-400" />
						</button>
					</div>
				</section>
			</div>
		</template>
	</div>
</template>
