<script setup lang="ts">
import type { Home, HomeShare, HomeContact } from "~/types";
import ContactCard from "~/components/homes/ContactCard.vue";
import { getFileIcon } from "~/utils/fileTypes";

const route = useRoute();
const { t } = useI18n();
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

const downloadFile = async (fileId: string) => {
	const response = await $fetch<{ url: string }>(`/api/homes/share/${token.value}/files/download`, {
		query: { fileId },
	});

	window.open(response.url, "_blank", "noopener,noreferrer");
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
	<div class="min-h-screen">
		<!-- Loading -->
		<div v-if="loading" class="flex items-center justify-center min-h-screen">
			<div class="text-center space-y-4">
				<div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
				<p class="text-stone-500">Laden...</p>
			</div>
		</div>

		<!-- Error -->
		<div v-else-if="error" class="flex items-center justify-center min-h-screen p-4">
			<div class="app-card text-center max-w-md rounded-[2rem] p-8">
				<div class="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
					<UIcon name="i-lucide-link-off" class="w-10 h-10 text-red-500" />
				</div>
				<h1 class="display-copy text-3xl font-bold mb-2">Link nicht verfügbar</h1>
				<p class="app-muted mb-6">{{ error }}</p>
				<p class="text-sm app-muted">Der Freigabelink ist möglicherweise abgelaufen oder wurde widerrufen.</p>
			</div>
		</div>

		<!-- Content -->
		<template v-else-if="home">
			<div class="max-w-screen-lg mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
				<div class="app-card rounded-[2rem] overflow-hidden">
					<div class="grid gap-0 md:grid-cols-[1.3fr_0.9fr]">
						<div class="relative min-h-[280px] md:min-h-[420px]">
							<img
								v-if="home.photos?.length"
								:src="home.photos[activePhoto]"
								:alt="`${home.name} Foto ${activePhoto + 1}`"
								class="absolute inset-0 h-full w-full object-cover"
							/>
							<div v-else class="absolute inset-0 bg-gradient-to-br from-[var(--app-primary)]/35 to-[var(--app-accent)]/35" />
							<div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.66)_100%)] p-6 md:p-8 flex flex-col justify-end">
								<div class="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85 backdrop-blur-sm mb-4">
									<UIcon name="i-lucide-house" class="w-3.5 h-3.5" />
									{{ t("share.welcome") }}
								</div>
								<h1 class="display-copy text-4xl md:text-5xl font-bold tracking-[-0.05em] text-white text-balance">{{ home.name }}</h1>
								<p class="mt-3 max-w-xl text-sm md:text-base text-white/82">
									{{ t("share.guestIntro") }}
								</p>
							</div>
						</div>
						<div class="p-5 md:p-8 flex flex-col justify-between gap-5">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)] mb-3">Schnellzugriff</p>
								<div class="grid gap-3">
									<div class="rounded-2xl border border-[var(--app-border)] bg-white/55 dark:bg-white/3 px-4 py-3">
										<p class="text-xs uppercase tracking-[0.18em] app-muted mb-1">{{ t("share.summary.photos") }}</p>
										<p class="font-semibold">{{ home.photos?.length || 0 }} {{ t("share.summary.photosValue") }}</p>
									</div>
									<div class="rounded-2xl border border-[var(--app-border)] bg-white/55 dark:bg-white/3 px-4 py-3">
										<p class="text-xs uppercase tracking-[0.18em] app-muted mb-1">{{ t("share.summary.documents") }}</p>
										<p class="font-semibold">{{ home.files?.length || 0 }} {{ t("share.summary.documentsValue") }}</p>
									</div>
									<div class="rounded-2xl border border-[var(--app-border)] bg-white/55 dark:bg-white/3 px-4 py-3">
										<p class="text-xs uppercase tracking-[0.18em] app-muted mb-1">{{ t("share.summary.contacts") }}</p>
										<p class="font-semibold">{{ contacts.length }} {{ t("share.summary.contactsValue") }}</p>
									</div>
								</div>
							</div>

							<div v-if="home.photos && home.photos.length > 1" class="space-y-3">
								<p class="text-xs font-semibold uppercase tracking-[0.22em] app-muted">{{ t("share.gallery") }}</p>
								<div class="flex gap-2 overflow-x-auto pb-1">
									<button
										v-for="(photo, index) in home.photos"
										:key="index"
										@click="activePhoto = index"
										class="shrink-0 w-16 h-16 rounded-2xl overflow-hidden ring-2 transition-all"
										:class="index === activePhoto ? 'ring-[var(--app-primary)] scale-[1.02]' : 'ring-transparent opacity-80 hover:opacity-100'"
									>
										<img :src="photo" :alt="`Thumbnail ${index + 1}`" class="w-full h-full object-cover" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Contacts -->
				<section v-if="contacts.length > 0" class="space-y-4">
					<h2 class="display-copy text-2xl font-bold flex items-center gap-2">
						<UIcon name="i-lucide-users" class="w-5 h-5" />
						{{ t("share.contacts") }}
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
				<section v-if="home.wifiSSID || home.wifiPassword" class="app-card rounded-[2rem] p-6 md:p-7">
					<div class="flex items-center gap-3 mb-4">
						<div class="p-3 bg-[var(--app-primary)]/10 rounded-2xl">
							<UIcon name="i-lucide-wifi" class="w-5 h-5 text-[var(--app-primary)]" />
						</div>
						<div>
							<h2 class="display-copy text-2xl font-bold">{{ t("share.wifiTitle") }}</h2>
							<p class="text-sm app-muted">{{ t("share.wifiSubtitle") }}</p>
						</div>
					</div>

					<div class="space-y-3">
						<!-- SSID -->
						<div v-if="home.wifiSSID" class="flex items-center gap-3 p-4 rounded-2xl bg-white/60 dark:bg-white/3 border border-[var(--app-border)]">
							<div class="flex-1">
								<p class="text-xs text-stone-500 mb-1">{{ t("share.ssid") }}</p>
								<code class="text-lg font-mono">{{ home.wifiSSID }}</code>
							</div>
							<UButton
								:icon="ssidCopied ? 'i-lucide-check' : 'i-lucide-copy'"
								:color="ssidCopied ? 'success' : 'neutral'"
								variant="soft"
								size="sm"
								@click="copySSID"
							>
								{{ ssidCopied ? t("share.copied") : t("share.copy") }}
							</UButton>
						</div>

						<!-- Password -->
						<div v-if="home.wifiPassword" class="flex items-center gap-3 p-4 rounded-2xl bg-white/60 dark:bg-white/3 border border-[var(--app-border)]">
							<div class="flex-1">
								<p class="text-xs text-stone-500 mb-1">{{ t("share.password") }}</p>
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
								{{ passwordCopied ? t("share.copied") : t("share.copy") }}
							</UButton>
						</div>
					</div>
				</section>

				<!-- Instructions -->
				<section v-if="home.instructions" class="app-card rounded-[2rem] p-6 md:p-7">
					<div class="flex items-center gap-3 mb-4">
						<div class="p-3 bg-[var(--app-accent)]/12 rounded-2xl">
							<UIcon name="i-lucide-file-text" class="w-5 h-5 text-[var(--app-accent)]" />
						</div>
						<div>
							<h2 class="display-copy text-2xl font-bold">{{ t("share.instructionsTitle") }}</h2>
							<p class="text-sm app-muted">{{ t("share.instructionsSubtitle") }}</p>
						</div>
					</div>
					<div class="prose dark:prose-invert max-w-none" v-html="home.instructions" />
				</section>

				<!-- Files -->
				<section v-if="home.files?.length" class="app-card rounded-[2rem] p-6 md:p-7">
					<div class="flex items-center gap-3 mb-4">
						<div class="p-3 bg-[var(--app-primary)]/10 rounded-2xl">
							<UIcon name="i-lucide-folder" class="w-5 h-5 text-[var(--app-primary)]" />
						</div>
						<div>
							<h2 class="display-copy text-2xl font-bold">{{ t("share.filesTitle") }}</h2>
							<p class="text-sm app-muted">{{ t("share.filesSubtitle") }}</p>
						</div>
					</div>
					<div class="space-y-3">
						<button
							v-for="file in home.files"
							:key="file.id"
							@click="downloadFile(file.id)"
							class="w-full flex items-center gap-4 p-4 rounded-2xl border border-[var(--app-border)] bg-white/60 dark:bg-white/3 hover:border-[var(--app-primary)] hover:bg-[var(--app-primary)]/6 transition-all text-left"
						>
							<div class="p-2 bg-stone-50 dark:bg-stone-700 rounded-lg">
								<UIcon :name="getFileIcon(file.type)" class="w-5 h-5 text-stone-500" />
							</div>
							<div class="flex-1 min-w-0">
								<p class="font-medium truncate">{{ file.name }}</p>
								<p class="text-sm text-stone-500">{{ formatFileSize(file.size) }}</p>
							</div>
							<UButton
								icon="i-lucide-download"
								color="neutral"
								variant="soft"
								size="sm"
								class="rounded-full"
							>
								{{ t("share.download") }}
							</UButton>
						</button>
					</div>
				</section>
			</div>
		</template>
	</div>
</template>
