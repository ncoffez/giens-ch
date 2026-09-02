<script setup lang="ts">
import type { Home } from "~/types";
import HomeShareView from "~/components/homes/HomeShareView.vue";

/**
 * Owner-only preview of the guest view. Unlike /homes/share/[token] this does not
 * need an active share link: the owner sees exactly what a guest would see, based
 * on the current data.
 */
definePageMeta({
	middleware: "home-owner",
});

const route = useRoute();
const { t } = useI18n();
const localePath = useLocalePath();
const toast = useToast();
const { getFreshToken, waitForAuth } = useAuthReady();

const homeId = computed(() => route.params.id as string);
const home = ref<Home | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const contacts = computed(() => (home.value?.contacts || []).filter((contact) => !contact.hidden));

/**
 * Mirrors what /api/homes/share/[token] hands a guest: private files are removed
 * so the preview cannot show more than the real share link would.
 */
const guestHome = computed<Home | null>(() => {
	if (!home.value) return null;

	return {
		...home.value,
		files: (home.value.files || []).filter((file) => file.visibility !== "private"),
		privateFiles: [],
	};
});

const fetchHome = async () => {
	try {
		await waitForAuth();
		loading.value = true;
		error.value = null;
		home.value = await $fetch<Home>(`/api/homes/${homeId.value}`, {
			headers: { Authorization: `Bearer ${await getFreshToken()}` },
		});
	} catch (e: unknown) {
		error.value = getFetchError(e) || t("homes.preview.loadError");
	} finally {
		loading.value = false;
	}
};

const downloadFile = async (fileId: string) => {
	try {
		const response = await $fetch<{ url: string }>(`/api/homes/${homeId.value}/files/download`, {
			headers: { Authorization: `Bearer ${await getFreshToken()}` },
			query: { fileId, private: "false" },
		});

		window.open(response.url, "_blank", "noopener,noreferrer");
	} catch (e: unknown) {
		toast.add({ title: t("homes.files.toasts.downloadFailed"), description: getFetchError(e), color: "error" });
	}
};

onMounted(fetchHome);

useHead(() => ({
	title: home.value ? `${t("homes.preview.title")}: ${home.value.name}` : t("homes.preview.title"),
	meta: [{ name: "robots", content: "noindex, nofollow" }],
}));
</script>

<template>
	<div class="min-h-screen">
		<!-- Preview banner: makes clear this is the owner looking at the guest view. -->
		<div class="sticky top-0 z-40 border-b border-[var(--app-border)] bg-amber-50/95 backdrop-blur dark:bg-amber-950/80">
			<div class="max-w-screen-lg mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
				<div class="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
					<UIcon name="i-lucide-eye" class="w-4 h-4 shrink-0" />
					<span>{{ t("homes.preview.banner") }}</span>
				</div>
				<UButton
					:to="localePath(`/homes/${homeId}/edit`)"
					variant="soft"
					color="neutral"
					size="sm"
					icon="i-lucide-arrow-left"
				>
					{{ t("homes.preview.backToEdit") }}
				</UButton>
			</div>
		</div>

		<div v-if="loading" class="flex items-center justify-center py-24">
			<div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
		</div>

		<div v-else-if="error" class="flex items-center justify-center p-4 py-24">
			<div class="app-card text-center max-w-md rounded-[2rem] p-8">
				<div class="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
					<UIcon name="i-lucide-triangle-alert" class="w-10 h-10 text-red-500" />
				</div>
				<h1 class="display-copy text-3xl font-bold mb-2">{{ t("homes.preview.loadError") }}</h1>
				<p class="app-muted">{{ error }}</p>
			</div>
		</div>

		<HomeShareView
			v-else-if="guestHome"
			:home="guestHome"
			:contacts="contacts"
			:download-file="downloadFile"
		/>
	</div>
</template>
