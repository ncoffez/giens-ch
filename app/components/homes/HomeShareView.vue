<script setup lang="ts">
import type { Home, HomeContact, HomeFile } from "~/types";
import ContactCard from "~/components/homes/ContactCard.vue";
import { getFileIcon, getFileIconBg, getFileIconColor } from "~/utils/fileTypes";

/**
 * The guest view of a home. Rendered both from a public share link and from the
 * owner-only preview route, so it must not assume a share token exists: the page
 * passes in the data and the download handler.
 */
const props = defineProps<{
	home: Home;
	contacts: HomeContact[];
	downloadFile: (fileId: string) => Promise<void> | void;
}>();

const { t, locale } = useI18n();
const activePhoto = ref(0);
const lightboxIndex = ref<number | null>(null);
const showWifiPassword = ref(false);
const ssidCopied = ref(false);
const passwordCopied = ref(false);

const home = computed(() => props.home);
const contacts = computed(() => props.contacts || []);

/**
 * The Anleitung is written in either German or French and the other language is
 * filled in automatically. Show the guest's own language, falling back to the
 * source text when no counterpart exists (yet).
 */
const instructionsHtml = computed(() => {
	const byLocale = home.value?.instructionsByLocale || {};
	const inViewerLocale = byLocale[locale.value as "de" | "fr"];

	return inViewerLocale || home.value?.instructions || byLocale.de || byLocale.fr || "";
});

const lightboxPhoto = computed(() => {
	if (lightboxIndex.value === null) return null;
	return home.value?.photos?.[lightboxIndex.value] || null;
});

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

const openLightbox = (index: number) => {
	activePhoto.value = index;
	lightboxIndex.value = index;
};

const closeLightbox = () => {
	lightboxIndex.value = null;
};

const showPreviousPhoto = () => {
	if (!home.value?.photos?.length || lightboxIndex.value === null) return;

	const nextIndex = (lightboxIndex.value - 1 + home.value.photos.length) % home.value.photos.length;
	lightboxIndex.value = nextIndex;
	activePhoto.value = nextIndex;
};

const showNextPhoto = () => {
	if (!home.value?.photos?.length || lightboxIndex.value === null) return;

	const nextIndex = (lightboxIndex.value + 1) % home.value.photos.length;
	lightboxIndex.value = nextIndex;
	activePhoto.value = nextIndex;
};

const handleLightboxKeydown = (event: KeyboardEvent) => {
	if (lightboxIndex.value === null) return;

	if (event.key === "Escape") {
		closeLightbox();
		return;
	}

	if (event.key === "ArrowLeft") {
		showPreviousPhoto();
		return;
	}

	if (event.key === "ArrowRight") {
		showNextPhoto();
	}
};

/* ------------------------------- Quick access ------------------------------ */

const GALLERY_PREVIEW_COUNT = 6;

const visibleGalleryPhotos = computed(() => (home.value?.photos || []).slice(0, GALLERY_PREVIEW_COUNT));
const hiddenGalleryCount = computed(() => Math.max((home.value?.photos?.length || 0) - GALLERY_PREVIEW_COUNT, 0));

/** Scrolls to a section instead of just stating that it exists. */
const scrollToSection = (id: string) => {
	if (!import.meta.client) return;

	document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const quickAccessTiles = computed(() => [
	{
		key: "photos",
		icon: "i-lucide-image",
		label: t("share.summary.photos"),
		count: home.value?.photos?.length || 0,
		action: () => openLightbox(0),
	},
	{
		key: "documents",
		icon: "i-lucide-folder",
		label: t("share.summary.documents"),
		count: home.value?.files?.length || 0,
		action: () => scrollToSection("share-documents"),
	},
	{
		key: "contacts",
		icon: "i-lucide-users",
		label: t("share.summary.contacts"),
		count: contacts.value.length,
		action: () => scrollToSection("share-contacts"),
	},
]);

/* ---------------------------------- Files ---------------------------------- */

// Image documents show their own thumbnail; if the URL cannot be loaded (bucket
// permissions, deleted object) the card falls back to the type icon.
const failedThumbnails = ref(new Set<string>());

const isImageFile = (file: HomeFile) => (file.type || "").startsWith("image/");
const showsThumbnail = (file: HomeFile) => isImageFile(file) && Boolean(file.url) && !failedThumbnails.value.has(file.id);

const markThumbnailFailed = (fileId: string) => {
	failedThumbnails.value = new Set([...failedThumbnails.value, fileId]);
};

/** Language-neutral type label: the extension, e.g. "PDF". */
const fileExtensionLabel = (name: string) => {
	const match = /\.([a-z0-9]{1,5})$/i.exec(name || "");
	return match ? match[1]!.toUpperCase() : "";
};

const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

onMounted(() => {
	if (import.meta.client) {
		window.addEventListener("keydown", handleLightboxKeydown);
	}
});

onBeforeUnmount(() => {
	if (import.meta.client) {
		window.removeEventListener("keydown", handleLightboxKeydown);
	}
});
</script>

<template>
	<div>
		<div class="max-w-screen-lg mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
			<div class="app-card rounded-[2rem] overflow-hidden">
				<div class="grid gap-0 md:grid-cols-[1.3fr_0.9fr]">
					<div class="relative min-h-[280px] md:min-h-[420px]">
						<img
							v-if="home.photos?.length"
							:src="home.photos[activePhoto]"
							:alt="`${home.name} Foto ${activePhoto + 1}`"
							class="absolute inset-0 h-full w-full cursor-zoom-in object-cover"
							@click="openLightbox(activePhoto)"
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
					<div class="p-5 md:p-8 flex flex-col justify-between gap-6">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)] mb-3">
								{{ t("share.quickAccess") }}
							</p>
							<!-- Three tiles that actually jump to their section, instead of
							     three stacked read-only rows. -->
							<div class="grid grid-cols-3 gap-2">
								<button
									v-for="tile in quickAccessTiles"
									:key="tile.key"
									type="button"
									class="group flex flex-col items-center gap-1 rounded-2xl border border-[var(--app-border)] bg-white/55 px-2 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-[var(--app-primary)] hover:bg-[var(--app-primary)]/6 disabled:pointer-events-none disabled:opacity-45 dark:bg-white/3"
									:disabled="tile.count === 0"
									@click="tile.action()"
								>
									<UIcon
										:name="tile.icon"
										class="h-4 w-4 text-[var(--app-primary)] transition-transform group-hover:scale-110"
									/>
									<span class="text-2xl font-bold leading-none tabular-nums">{{ tile.count }}</span>
									<span class="text-[11px] uppercase tracking-[0.14em] app-muted leading-tight">{{ tile.label }}</span>
								</button>
							</div>
						</div>

						<div v-if="home.photos && home.photos.length > 1" class="space-y-3">
							<p class="text-xs font-semibold uppercase tracking-[0.22em] app-muted">{{ t("share.gallery") }}</p>
							<!-- A tile grid rather than a cramped scroll strip; the last tile
							     carries the overflow count when there are more photos. -->
							<div class="grid grid-cols-3 gap-2">
								<button
									v-for="(photo, index) in visibleGalleryPhotos"
									:key="photo"
									type="button"
									class="group relative aspect-square overflow-hidden rounded-2xl ring-2 transition-all"
									:class="index === activePhoto ? 'ring-[var(--app-primary)]' : 'ring-transparent hover:ring-[var(--app-border)]'"
									:aria-label="t('homes.photos.photoAlt', { index: index + 1 })"
									@click="openLightbox(index)"
								>
									<img
										:src="photo"
										:alt="t('homes.photos.photoAlt', { index: index + 1 })"
										loading="lazy"
										class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
									<span
										v-if="index === visibleGalleryPhotos.length - 1 && hiddenGalleryCount > 0"
										class="absolute inset-0 grid place-items-center bg-black/55 text-lg font-semibold text-white backdrop-blur-[1px]"
									>
										+{{ hiddenGalleryCount }}
									</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Contacts -->
			<section v-if="contacts.length > 0" id="share-contacts" class="scroll-mt-6 space-y-4">
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
			<section v-if="instructionsHtml" class="app-card rounded-[2rem] p-6 md:p-7">
				<div class="flex items-center gap-3 mb-4">
					<div class="p-3 bg-[var(--app-accent)]/12 rounded-2xl">
						<UIcon name="i-lucide-file-text" class="w-5 h-5 text-[var(--app-accent)]" />
					</div>
					<div>
						<h2 class="display-copy text-2xl font-bold">{{ t("share.instructionsTitle") }}</h2>
						<p class="text-sm app-muted">{{ t("share.instructionsSubtitle") }}</p>
					</div>
				</div>
				<div class="prose dark:prose-invert max-w-none" v-html="instructionsHtml" />
			</section>

			<!-- Files -->
			<section v-if="home.files?.length" id="share-documents" class="app-card scroll-mt-6 rounded-[2rem] p-6 md:p-7">
				<div class="flex items-center gap-3 mb-4">
					<div class="p-3 bg-[var(--app-primary)]/10 rounded-2xl">
						<UIcon name="i-lucide-folder" class="w-5 h-5 text-[var(--app-primary)]" />
					</div>
					<div>
						<h2 class="display-copy text-2xl font-bold">{{ t("share.filesTitle") }}</h2>
						<p class="text-sm app-muted">{{ t("share.filesSubtitle") }}</p>
					</div>
				</div>
				<!-- Two columns from sm upwards; a single document keeps the full width
				     rather than sitting alone in half a row. -->
				<div class="grid gap-3" :class="home.files.length > 1 ? 'sm:grid-cols-2' : ''">
					<button
						v-for="file in home.files"
						:key="file.id"
						:title="file.name"
						@click="downloadFile(file.id)"
						class="group flex h-full items-center gap-4 rounded-2xl border border-[var(--app-border)] bg-white/60 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--app-primary)] hover:bg-[var(--app-primary)]/5 hover:shadow-[0_12px_30px_-16px_rgba(0,0,0,0.45)] dark:bg-white/3"
					>
						<div
							class="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl"
							:class="showsThumbnail(file) ? 'bg-stone-100 dark:bg-stone-800' : getFileIconBg(file.type)"
						>
							<img
								v-if="showsThumbnail(file)"
								:src="file.url"
								:alt="file.name"
								loading="lazy"
								class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
								@error="markThumbnailFailed(file.id)"
							/>
							<UIcon
								v-else
								:name="getFileIcon(file.type)"
								class="h-6 w-6"
								:class="getFileIconColor(file.type)"
							/>
						</div>

						<div class="min-w-0 flex-1">
							<p class="font-medium leading-snug line-clamp-2 break-words">{{ file.name }}</p>
							<p class="mt-1 text-xs font-medium uppercase tracking-[0.12em] app-muted">
								<template v-if="fileExtensionLabel(file.name)">{{ fileExtensionLabel(file.name) }} · </template>{{ formatFileSize(file.size) }}
							</p>
						</div>

						<span
							class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/6 text-[var(--app-text)] transition-colors group-hover:bg-[var(--app-primary)] group-hover:text-white dark:bg-white/8"
							:aria-label="t('share.download')"
						>
							<UIcon name="i-lucide-download" class="h-4 w-4" />
						</span>
					</button>
				</div>
			</section>
		</div>
		<div
			v-if="lightboxPhoto"
			class="fixed inset-0 z-[80] flex items-center justify-center bg-black/92 p-4 md:p-8"
			@click="closeLightbox"
		>
			<button
				class="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
				:aria-label="t('share.closeImage')"
				@click.stop="closeLightbox"
			>
				<UIcon name="i-lucide-x" class="h-5 w-5" />
			</button>

			<button
				v-if="home?.photos?.length && home.photos.length > 1"
				class="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
				:aria-label="t('share.previousImage')"
				@click.stop="showPreviousPhoto"
			>
				<UIcon name="i-lucide-chevron-left" class="h-5 w-5" />
			</button>

			<img
				:src="lightboxPhoto"
				:alt="`${home?.name || 'Home'} Foto ${(lightboxIndex ?? 0) + 1}`"
				class="max-h-[92vh] max-w-[92vw] rounded-[1.5rem] object-contain shadow-2xl"
				@click.stop
			/>

			<button
				v-if="home?.photos?.length && home.photos.length > 1"
				class="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
				:aria-label="t('share.nextImage')"
				@click.stop="showNextPhoto"
			>
				<UIcon name="i-lucide-chevron-right" class="h-5 w-5" />
			</button>
		</div>
	</div>
</template>
