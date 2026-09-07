<script setup lang="ts">
import type { MemoriamEntry } from "../../../types";
import { formatMemoriamPeriod, memoriamBioForLocale } from "~/utils/memoriam";

const { t, locale } = useI18n();
const nuxtApp = useNuxtApp();
const localePath = useLocalePath();
const { authorizedFetch } = useApi();
const { waitForAuth } = useAuthReady();

const isOwner = computed(() => import.meta.client ? !!nuxtApp.$isOwner?.value : false);
const isAdmin = computed(() => import.meta.client ? !!nuxtApp.$isAdmin?.value : false);

const entries = ref<MemoriamEntry[]>([]);
const pending = ref(false);
const loaded = ref(false);

async function loadEntries() {
	if (!isOwner.value) {
		entries.value = [];
		loaded.value = false;
		return;
	}

	pending.value = true;
	try {
		await waitForAuth();
		entries.value = await authorizedFetch<MemoriamEntry[]>("/api/memoriam");
		loaded.value = true;
	} catch {
		entries.value = [];
		loaded.value = true;
	} finally {
		pending.value = false;
	}
}

watch(isOwner, (visible) => {
	if (visible) {
		void loadEntries();
	} else {
		entries.value = [];
		loaded.value = false;
	}
}, { immediate: true });

function bioHtml(entry: MemoriamEntry) {
	return memoriamBioForLocale(entry, locale.value);
}

function periodLabel(entry: MemoriamEntry) {
	return formatMemoriamPeriod(entry.periodFrom, entry.periodTo);
}

const lightbox = ref<{ photos: string[]; name: string; index: number } | null>(null);
const lightboxPhoto = computed(() => {
	if (!lightbox.value) return null;
	return lightbox.value.photos[lightbox.value.index] || null;
});

function bindLightbox() {
	if (!import.meta.client) return;
	document.addEventListener("keydown", handleLightboxKeydown);
	document.body.style.overflow = "hidden";
}

function unbindLightbox() {
	if (!import.meta.client) return;
	document.removeEventListener("keydown", handleLightboxKeydown);
	document.body.style.overflow = "";
}

function openLightbox(entry: MemoriamEntry, index: number) {
	if (!entry.photos.length) return;
	const wasClosed = lightbox.value === null;
	lightbox.value = {
		photos: entry.photos,
		name: entry.name,
		index,
	};
	if (wasClosed) bindLightbox();
}

function closeLightbox() {
	lightbox.value = null;
	unbindLightbox();
}

function showPreviousPhoto() {
	if (!lightbox.value || lightbox.value.photos.length < 2) return;
	const count = lightbox.value.photos.length;
	lightbox.value = {
		...lightbox.value,
		index: (lightbox.value.index - 1 + count) % count,
	};
}

function showNextPhoto() {
	if (!lightbox.value || lightbox.value.photos.length < 2) return;
	const count = lightbox.value.photos.length;
	lightbox.value = {
		...lightbox.value,
		index: (lightbox.value.index + 1) % count,
	};
}

function handleLightboxKeydown(event: KeyboardEvent) {
	if (!lightbox.value) return;
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
}

onBeforeUnmount(unbindLightbox);
</script>

<template>
	<section
		v-if="isOwner"
		data-memoriam-section
		class="max-w-screen-lg mx-auto px-4"
	>
		<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10">
			<UiTitle :title="t('memoriam.title')" :subtitle="t('memoriam.subtitle')" />
			<UButton
				v-if="isAdmin"
				color="neutral"
				variant="outline"
				icon="i-lucide-pencil"
				:to="localePath('/admin/memoriam')"
			>
				{{ t("memoriam.manage") }}
			</UButton>
		</div>

		<div v-if="pending && !loaded" class="flex justify-center py-12">
			<div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
		</div>

		<div
			v-else-if="!entries.length"
			class="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-dashed border-stone-200 dark:border-stone-700"
		>
			<UIcon name="i-lucide-flower-2" class="w-10 h-10 mx-auto text-stone-300 mb-3" />
			<p class="text-stone-500 font-semibold">{{ t("memoriam.emptyTitle") }}</p>
			<p class="text-sm text-stone-400 mt-2">{{ t("memoriam.emptyText") }}</p>
		</div>

		<div v-else class="space-y-10">
			<article
				v-for="entry in entries"
				:key="entry.id"
				class="grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-8 rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 md:p-8"
			>
				<div class="space-y-3">
					<button
						v-if="entry.photos[0]"
						type="button"
						class="block w-full cursor-zoom-in"
						:aria-label="t('memoriam.openImage')"
						@click="openLightbox(entry, 0)"
					>
						<img
							:src="entry.photos[0]"
							:alt="entry.name"
							class="w-full aspect-square object-cover rounded-2xl bg-stone-100 dark:bg-stone-800"
						>
					</button>
					<div
						v-else
						class="w-full aspect-square rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center"
					>
						<UIcon name="i-lucide-user" class="w-10 h-10 text-stone-300" />
					</div>
					<div v-if="entry.photos.length > 1" class="grid grid-cols-3 gap-2">
						<button
							v-for="(photo, photoIndex) in entry.photos.slice(1)"
							:key="photo"
							type="button"
							class="cursor-zoom-in"
							:aria-label="t('memoriam.openImage')"
							@click="openLightbox(entry, photoIndex + 1)"
						>
							<img
								:src="photo"
								:alt="entry.name"
								class="aspect-square object-cover rounded-lg bg-stone-100 dark:bg-stone-800"
							>
						</button>
					</div>
				</div>

				<div class="min-w-0">
					<h3 class="display-copy text-2xl md:text-3xl font-bold tracking-[-0.03em]">{{ entry.name }}</h3>
					<p v-if="periodLabel(entry)" class="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--app-primary)]">
						{{ t("memoriam.periodLabel") }} {{ periodLabel(entry) }}
					</p>
					<div
						v-if="bioHtml(entry)"
						class="prose dark:prose-invert max-w-none mt-5"
						v-html="bioHtml(entry)"
					/>
				</div>
			</article>
		</div>

		<Teleport to="body">
			<div
				v-if="lightboxPhoto"
				class="fixed inset-0 z-[80] flex items-center justify-center bg-black/92 p-4 md:p-8"
				data-memoriam-lightbox
				@click="closeLightbox"
			>
				<button
					type="button"
					class="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
					:aria-label="t('memoriam.closeImage')"
					@click.stop="closeLightbox"
				>
					<UIcon name="i-lucide-x" class="h-5 w-5" />
				</button>

				<button
					v-if="lightbox && lightbox.photos.length > 1"
					type="button"
					class="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
					:aria-label="t('memoriam.previousImage')"
					@click.stop="showPreviousPhoto"
				>
					<UIcon name="i-lucide-chevron-left" class="h-5 w-5" />
				</button>

				<img
					:src="lightboxPhoto"
					:alt="lightbox?.name"
					class="max-h-[92vh] max-w-[92vw] rounded-[1.5rem] object-contain shadow-2xl"
					@click.stop
				>

				<button
					v-if="lightbox && lightbox.photos.length > 1"
					type="button"
					class="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
					:aria-label="t('memoriam.nextImage')"
					@click.stop="showNextPhoto"
				>
					<UIcon name="i-lucide-chevron-right" class="h-5 w-5" />
				</button>
			</div>
		</Teleport>
	</section>
</template>
