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
			class="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center dark:bg-stone-900/40 md:rounded-3xl md:p-10"
		>
			<UIcon name="i-lucide-folder-open" class="w-12 h-12 mx-auto text-stone-400 mb-4" />
			<p class="font-semibold text-stone-700 dark:text-stone-300">{{ t("ownerDocuments.emptyTitle") }}</p>
			<p class="text-sm text-stone-500 mt-2">{{ t("ownerDocuments.emptyText") }}</p>
		</div>

		<div v-else class="grid gap-6">
			<section
				v-for="group in groupedDocuments"
				:key="group.homeId"
				class="rounded-2xl border border-stone-200/80 bg-stone-50/75 p-4 dark:border-stone-800 dark:bg-stone-900/50 md:rounded-[2rem] md:border-[var(--app-border)] md:bg-[var(--app-surface-strong)] md:p-6 md:shadow-[var(--app-shadow)]"
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
					<div
						v-for="document in group.documents"
						:key="document.id"
						:data-owner-file-id="document.id"
						class="flex w-full items-center gap-4 rounded-2xl border border-stone-200 bg-white/90 px-4 py-4 text-left transition hover:border-primary hover:bg-primary-50/50 dark:border-stone-700 dark:bg-stone-800/70 dark:hover:bg-primary-900/10"
						:class="{ 'ring-2 ring-primary': highlightedFileId === document.id }"
					>
						<button
							type="button"
							class="flex min-w-0 flex-1 items-center gap-4 text-left"
							:title="document.name"
							@click="handleDocumentClick(document)"
						>
							<div class="rounded-xl bg-stone-100 p-3 dark:bg-stone-900">
								<UIcon :name="getFileIcon(document.type)" class="w-5 h-5" :class="getFileIconColor(document.type)" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate font-semibold">{{ truncateFileName(document.name) }}</p>
								<p class="text-sm text-stone-500">
									{{ formatFileSize(document.size) }} · {{ t("ownerDocuments.lastUpdated") }}: {{ formatDate(document) }}
								</p>
							</div>
							<UIcon
								:name="canPreview(document) ? 'i-lucide-eye' : 'i-lucide-download'"
								class="w-5 h-5 text-stone-400"
							/>
						</button>
						<div class="flex items-center gap-2">
							<UButton
								v-if="canPreview(document)"
								variant="ghost"
								color="neutral"
								icon="i-lucide-eye"
								size="sm"
								:title="t('homes.files.actions.preview')"
								:aria-label="t('homes.files.actions.preview')"
								@click="openPreview(document)"
							/>
							<UButton
								variant="ghost"
								color="neutral"
								icon="i-lucide-download"
								size="sm"
								:title="t('homes.files.actions.download')"
								:aria-label="t('homes.files.actions.download')"
								@click="downloadDocument(document)"
							/>
							<UButton
								variant="ghost"
								color="neutral"
								icon="i-lucide-link"
								size="sm"
								:title="t('ownerDocuments.copyLink')"
								:aria-label="t('ownerDocuments.copyLink')"
								@click="copyDocumentLink(document)"
							/>
							<UButton
								v-if="locale !== 'de'"
								variant="ghost"
								color="primary"
								icon="i-lucide-languages"
								size="sm"
								:loading="downloadingTranslatedId === document.id"
								@click="downloadTranslatedDocument(document)"
							/>
						</div>
					</div>
				</div>
			</section>
		</div>

		<FilePreviewModal
			:file="previewDocument"
			:url="previewUrl"
			:loading="previewLoading"
			@close="closePreview()"
			@download="previewDocument && downloadDocument(previewDocument)"
		/>
	</div>
</template>

<script lang="ts" setup>
import { canPreviewFile, getFileIcon, getFileIconColor, truncateFileName } from "~/utils/fileTypes";
import FilePreviewModal from "~/components/documents/FilePreviewModal.vue";

definePageMeta({ middleware: ["is-owner"] });

interface OwnerDocumentItem {
	id: string;
	homeId: string;
	homeName: string;
	name: string;
	type: string;
	size: number;
	uploadedAt: string;
	updatedAt?: string;
	lastModified?: number;
	uploadedBy: string;
	downloadPath: string;
}

const { t, locale } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const { token, waitForAuth } = useAuthReady();
const toast = useToast();

const documents = ref<OwnerDocumentItem[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);
const downloadingTranslatedId = ref<string | null>(null);

const highlightedFileId = computed(() => {
	const fileId = route.query.fileId;
	return typeof fileId === "string" ? fileId : "";
});

const focusHighlightedFile = async () => {
	if (!highlightedFileId.value) return;

	await nextTick();
	const target = document.querySelector(`[data-owner-file-id="${highlightedFileId.value}"]`);
	if (target instanceof HTMLElement) {
		target.scrollIntoView({ block: "center", behavior: "smooth" });
	}
};

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

	return Array.from(grouped.values()).map((group) => ({
		...group,
		documents: [...group.documents].sort((a, b) => getDocumentTimestamp(b) - getDocumentTimestamp(a)),
	}));
});

const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getDocumentTimestamp = (document: OwnerDocumentItem) => {
	const isoTimestamp = Date.parse(document.updatedAt || document.uploadedAt || "");
	if (!Number.isNaN(isoTimestamp) && isoTimestamp > 0) return isoTimestamp;
	if (typeof document.lastModified === "number" && Number.isFinite(document.lastModified)) return document.lastModified;
	return 0;
};

const formatDate = (document: OwnerDocumentItem) => {
	const timestamp = getDocumentTimestamp(document);
	if (!timestamp) return "—";

	return new Date(timestamp).toLocaleDateString(locale.value === "fr" ? "fr-CH" : "de-CH", {
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
		await focusHighlightedFile();
	} catch (e: unknown) {
		error.value = getFetchError(e) || t("ownerDocuments.loadError");
	} finally {
		pending.value = false;
	}
};

const buildDeepLink = (document: OwnerDocumentItem) => {
	const targetUrl = new URL(route.path || "/owner/documents", window.location.origin);
	targetUrl.searchParams.set("fileId", document.id);
	return targetUrl.toString();
};

const copyDocumentLink = async (document: OwnerDocumentItem) => {
	await navigator.clipboard.writeText(buildDeepLink(document));
	toast.add({ title: "Link kopiert", color: "success" });
};

/* --------------------------------- Preview --------------------------------- */

const previewDocument = ref<OwnerDocumentItem | null>(null);
const previewUrl = ref("");
const previewLoading = ref(false);

const canPreview = (document: OwnerDocumentItem) => canPreviewFile(document.type);

const requestDocumentUrl = async (document: OwnerDocumentItem) => {
	const response = await $fetch<{ url: string }>(document.downloadPath, {
		headers: { Authorization: `Bearer ${token.value}` },
	});

	return response.url;
};

const openPreview = async (document: OwnerDocumentItem) => {
	previewDocument.value = document;
	previewUrl.value = "";
	previewLoading.value = true;

	try {
		previewUrl.value = await requestDocumentUrl(document);
	} catch (e: unknown) {
		previewDocument.value = null;
		toast.add({ title: t("homes.files.toasts.previewFailed"), description: getFetchError(e), color: "error" });
	} finally {
		previewLoading.value = false;
	}
};

const closePreview = () => {
	previewDocument.value = null;
	previewUrl.value = "";
};

/** Preview when the browser can render it, otherwise fall back to a download. */
const handleDocumentClick = (document: OwnerDocumentItem) => {
	if (canPreview(document)) {
		return openPreview(document);
	}

	return downloadDocument(document);
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

const downloadTranslatedDocument = async (document: OwnerDocumentItem) => {
	if (locale.value === "de") return;

	try {
		downloadingTranslatedId.value = document.id;
		const response = await fetch(`/api/homes/${document.homeId}/files/translated-download?fileId=${encodeURIComponent(document.id)}&locale=${encodeURIComponent(locale.value)}`, {
			headers: { Authorization: `Bearer ${token.value}` },
		});

		if (!response.ok) {
			throw new Error(await response.text().catch(() => ""));
		}

		const blob = await response.blob();
		const downloadUrl = window.URL.createObjectURL(blob);
		const disposition = response.headers.get("content-disposition") || "";
		const fileName = disposition.match(/filename="([^"]+)"/)?.[1]
			|| `${document.name}-${locale.value}-translated.html`;
		const link = window.document.createElement("a");
		link.href = downloadUrl;
		link.download = fileName;
		link.style.display = "none";
		window.document.body.appendChild(link);
		link.click();
		setTimeout(() => {
			window.document.body.removeChild(link);
			window.URL.revokeObjectURL(downloadUrl);
		}, 100);
	} catch (e: unknown) {
		error.value = getFetchError(e) || t("ownerDocuments.downloadError");
	} finally {
		downloadingTranslatedId.value = null;
	}
};

watch(highlightedFileId, () => {
	if (highlightedFileId.value) {
		focusHighlightedFile();
	}
});

onMounted(fetchDocuments);
</script>
