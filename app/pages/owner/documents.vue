<template>
	<div class="flex flex-col max-w-screen-xl mx-auto px-4 py-8 gap-8">
		<UiTitle :title="t('ownerDocuments.title')" :subtitle="t('ownerDocuments.subtitle')" />

		<div v-if="pending" class="flex justify-center py-12">
			<div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
		</div>

		<div v-else-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
			<p class="font-semibold">{{ t("ownerDocuments.loadError") }}</p>
			<p class="text-sm mt-2">{{ error }}</p>
		</div>

		<div
			v-else-if="!documents.length"
			class="rounded-3xl border border-dashed border-stone-300 p-10 text-center bg-stone-50 dark:bg-stone-900/40"
		>
			<UIcon name="i-lucide-folder-open" class="w-12 h-12 mx-auto text-stone-400 mb-4" />
			<p class="font-semibold text-stone-700 dark:text-stone-300">{{ t("ownerDocuments.emptyTitle") }}</p>
			<p class="text-sm text-stone-500 mt-2">{{ t("ownerDocuments.emptyText") }}</p>
		</div>

		<div v-else class="grid gap-6">
			<section
				v-for="group in groupedDocuments"
				:key="group.homeId"
				class="rounded-3xl border border-stone-200 bg-white p-6 dark:bg-stone-900/40 dark:border-stone-800"
			>
				<div class="flex items-center justify-between gap-4 mb-5">
					<div>
						<h2 class="text-xl font-black">{{ group.homeName }}</h2>
						<p class="text-sm text-stone-500">{{ t("ownerDocuments.fileCount", { count: group.documents.length }) }}</p>
					</div>
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-square-pen"
						:to="localePath(`/homes/${group.homeId}/edit`)"
					>
						{{ t("ownerDocuments.manageHome") }}
					</UButton>
				</div>

				<div class="grid gap-3">
					<button
						v-for="document in group.documents"
						:key="document.id"
						type="button"
						class="flex w-full items-center gap-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-left transition hover:border-primary hover:bg-primary-50/50 dark:border-stone-700 dark:bg-stone-800/50 dark:hover:bg-primary-900/10"
						:class="{ 'ring-2 ring-primary': highlightedFileId === document.id }"
						@click="downloadDocument(document)"
					>
						<div class="rounded-xl bg-white p-3 dark:bg-stone-900">
							<UIcon :name="getFileIcon(document.type)" class="w-5 h-5" :class="getFileIconColor(document.type)" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate font-semibold">{{ document.name }}</p>
							<p class="text-sm text-stone-500">
								{{ formatFileSize(document.size) }} · {{ formatDate(document.uploadedAt) }}
							</p>
						</div>
						<UIcon name="i-lucide-download" class="w-5 h-5 text-stone-400" />
					</button>
				</div>
			</section>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { getFileIcon, getFileIconColor } from "~/utils/fileTypes";

definePageMeta({ middleware: ["is-owner"] });

interface OwnerDocumentItem {
	id: string;
	homeId: string;
	homeName: string;
	name: string;
	type: string;
	size: number;
	uploadedAt: string;
	uploadedBy: string;
	downloadPath: string;
}

const { t, locale } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const { token, waitForAuth } = useAuthReady();

const documents = ref<OwnerDocumentItem[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);

const highlightedFileId = computed(() => {
	const fileId = route.query.fileId;
	return typeof fileId === "string" ? fileId : "";
});

const groupedDocuments = computed(() => {
	const grouped = new Map<string, { homeId: string; homeName: string; documents: OwnerDocumentItem[] }>();

	for (const document of documents.value) {
		if (!grouped.has(document.homeId)) {
			grouped.set(document.homeId, {
				homeId: document.homeId,
				homeName: document.homeName,
				documents: [],
			});
		}

		grouped.get(document.homeId)?.documents.push(document);
	}

	return Array.from(grouped.values());
});

const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString(locale.value === "fr" ? "fr-CH" : "de-CH", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
};

const fetchDocuments = async () => {
	try {
		await waitForAuth();
		pending.value = true;
		error.value = null;

		const response = await $fetch<{ documents: OwnerDocumentItem[] }>("/api/owner/documents", {
			headers: { Authorization: `Bearer ${token.value}` },
		});
		documents.value = response.documents || [];
	} catch (e: unknown) {
		error.value = getFetchError(e) || t("ownerDocuments.loadError");
	} finally {
		pending.value = false;
	}
};

const downloadDocument = async (document: OwnerDocumentItem) => {
	try {
		const response = await $fetch<{ url: string }>(document.downloadPath, {
			headers: { Authorization: `Bearer ${token.value}` },
		});
		window.open(response.url, "_blank", "noopener,noreferrer");
	} catch (e: unknown) {
		error.value = getFetchError(e) || t("ownerDocuments.downloadError");
	}
};

onMounted(fetchDocuments);
</script>
