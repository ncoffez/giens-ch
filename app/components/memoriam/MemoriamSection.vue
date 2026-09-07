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
					<img
						v-if="entry.photos[0]"
						:src="entry.photos[0]"
						:alt="entry.name"
						class="w-full aspect-square object-cover rounded-2xl bg-stone-100 dark:bg-stone-800"
					>
					<div
						v-else
						class="w-full aspect-square rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center"
					>
						<UIcon name="i-lucide-user" class="w-10 h-10 text-stone-300" />
					</div>
					<div v-if="entry.photos.length > 1" class="grid grid-cols-3 gap-2">
						<img
							v-for="photo in entry.photos.slice(1, 4)"
							:key="photo"
							:src="photo"
							:alt="entry.name"
							class="aspect-square object-cover rounded-lg bg-stone-100 dark:bg-stone-800"
						>
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
	</section>
</template>
