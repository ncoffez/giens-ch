<script setup lang="ts">
import type { GlobalFile, GlobalFolder } from "../../../types";
import GalleryViewer from "~/components/documents/GalleryViewer.vue";
import VideoPlayer from "~/components/documents/VideoPlayer.vue";
import { getFileTypeName, getFileIcon, getFileIconColor, getFileIconBg, truncateFileName } from "~/utils/fileTypes";

definePageMeta({ middleware: ["is-logged-in"] });

const { $isAdmin, $isOwner, $currentUser } = useNuxtApp();
const { waitForAuth, token } = useAuthReady();
const { locale, t } = useI18n();
const toast = useToast();
const route = useRoute();

interface DocumentTranslationState {
	searchText: string;
	searchSummary: string;
	translatedAt: string;
	model: string;
}

interface DocumentProcessingState {
	searchText: string;
	searchSummary: string;
	searchKeywords?: string[];
	searchUpdatedAt: string;
	extractionSource: "text" | "ooxml" | "gemini" | "metadata";
	ocrApplied: boolean;
	translationLanguages?: string[];
	translations?: Record<string, DocumentTranslationState>;
	localizedText?: string;
	localizedSummary?: string;
}

const files = ref<GlobalFile[]>([]);
const folders = ref<GlobalFolder[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const currentFolderId = ref<string | null>(null);
const selectedFiles = ref<GlobalFile[]>([]);
const selectedFolders = ref<GlobalFolder[]>([]);
const dragover = ref(false);
const downloadingFileId = ref<string | null>(null);
const isRenameModalOpen = ref(false);
const isMoveModalOpen = ref(false);
const renameValue = ref("");
const isSaving = ref(false);
const moveBrowseFolderId = ref<string | null>(null);

const viewMode = ref<"grid" | "list">("list");
const sortBy = ref<"name" | "date" | "size">("date");
const sortOrder = ref<"asc" | "desc">("desc");

const cursor = ref<string | null>(null);
const hasMore = ref(false);
const isLoadingMore = ref(false);
const sentinelRef = ref<HTMLElement | null>(null);
const PAGE_SIZE = 50;

const uploadQueue = ref<{
	total: number;
	completed: number;
	currentFile: string | null;
	isUploading: boolean;
}>({
	total: 0,
	completed: 0,
	currentFile: null,
	isUploading: false,
});

const editingFolderId = ref<string | null>(null);
const editingFolderName = ref("");
const tempFolders = ref<GlobalFolder[]>([]);

const galleryOpen = ref(false);
const galleryIndex = ref(0);
const videoOpen = ref(false);
const currentVideo = ref<GlobalFile | null>(null);
const previewFile = ref<GlobalFile | null>(null);
const previewUrl = ref<string | null>(null);
const previewLoading = ref(false);
const processingLoading = ref(false);
const processingError = ref<string | null>(null);
const documentProcessing = ref<DocumentProcessingState | null>(null);
const highlightedFileId = computed(() => {
	const fileId = route.query.fileId;
	return typeof fileId === "string" ? fileId : "";
});
const deepLinkBasePath = computed(() => route.path || "/documents");
const activePreviewLocale = computed(() => locale.value === "fr" ? "fr" : "de");
const activeTranslation = computed(() => {
	if (!documentProcessing.value || activePreviewLocale.value === "de") return null;
	return documentProcessing.value.translations?.[activePreviewLocale.value] || null;
});
const previewSummaryText = computed(() => {
	if (!documentProcessing.value) return "";
	return activeTranslation.value?.searchSummary || documentProcessing.value.localizedSummary || documentProcessing.value.searchSummary;
});
const previewBodyText = computed(() => {
	if (!documentProcessing.value) return "";
	return activeTranslation.value?.searchText || documentProcessing.value.localizedText || documentProcessing.value.searchText;
});
const translationStatusLabel = computed(() => {
	if (!documentProcessing.value?.translationLanguages?.length) return t("documents.processing.noAutoTranslation");
	if (activePreviewLocale.value === "de") return t("documents.processing.originalLanguage");
	return documentProcessing.value.translationLanguages.includes(activePreviewLocale.value)
		? t("documents.processing.translationLabel", { locale: activePreviewLocale.value.toUpperCase() })
		: t("documents.processing.noTranslationForLanguage");
});
const canDownloadTranslatedFile = computed(() => !!activeTranslation.value?.searchText && !!previewFile.value);
const dateLocale = computed(() => locale.value === "fr" ? "fr-FR" : "de-CH");
const currentUserId = computed(() => $currentUser?.value?.uid || "");
const canManageDocuments = computed(() => !!($isAdmin.value || $isOwner.value));
const canDeleteFile = (file: GlobalFile) => $isAdmin.value || (!!currentUserId.value && file.uploadedBy === currentUserId.value);
const canDeleteFolder = (folder: GlobalFolder) => $isAdmin.value || (!!currentUserId.value && folder.createdBy === currentUserId.value);
const canDeleteSelection = computed(() => {
	return selectedFiles.value.every(file => canDeleteFile(file))
		&& selectedFolders.value.every(folder => canDeleteFolder(folder));
});

const currentFolder = computed(() => {
	if (!currentFolderId.value) return null;
	return folders.value.find(f => f.id === currentFolderId.value) || null;
});

const breadcrumbs = computed(() => {
	const crumbs: GlobalFolder[] = [];
	if (!currentFolderId.value) return crumbs;

	let folder = folders.value.find(f => f.id === currentFolderId.value);
	while (folder) {
		crumbs.unshift(folder);
		folder = folders.value.find(f => f.id === folder.parentId);
	}
	return crumbs;
});

const currentSubfolders = computed(() => {
	return folders.value.filter(f => f.parentId === currentFolderId.value);
});

const sortedImages = computed(() => {
	return sortedFiles.value.filter(f => f.type.startsWith("image/"));
});

const sortedSubfolders = computed(() => {
	const sorted = [...currentSubfolders.value, ...tempFolders.value.filter(f => f.parentId === currentFolderId.value)];
	sorted.sort((a, b) => {
		let comparison = 0;
		if (sortBy.value === "name") {
			comparison = a.name.localeCompare(b.name, "de");
		} else if (sortBy.value === "date") {
			comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
		}
		return sortOrder.value === "asc" ? comparison : -comparison;
	});
	return sorted;
});

const sortedFiles = computed(() => {
	return files.value.filter(f => f.folderId === currentFolderId.value);
});

const availableFoldersForMove = computed(() => {
	const currentFolderIds = new Set<string>();
	
	if (selectedFolders.value.length > 0) {
		const collectDescendants = (parentId: string) => {
			folders.value.filter(f => f.parentId === parentId).forEach(f => {
				currentFolderIds.add(f.id);
				collectDescendants(f.id);
			});
		};
		selectedFolders.value.forEach(f => {
			currentFolderIds.add(f.id);
			collectDescendants(f.id);
		});
	}
	
	return folders.value.filter(f => 
		f.id !== currentFolderId.value && !currentFolderIds.has(f.id)
	);
});

const moveBrowseSubfolders = computed(() => {
	const selectedFolderIds = new Set(selectedFolders.value.map(f => f.id));
	const collectDescendants = (parentId: string): string[] => {
		const result: string[] = [parentId];
		folders.value.filter(f => f.parentId === parentId).forEach(f => {
			result.push(...collectDescendants(f.id));
		});
		return result;
	};
	
	const excludedIds = new Set<string>();
	selectedFolders.value.forEach(f => {
		excludedIds.add(f.id);
		collectDescendants(f.id).forEach(id => excludedIds.add(id));
	});
	
	return folders.value
		.filter(f => f.parentId === moveBrowseFolderId.value)
		.filter(f => !excludedIds.has(f.id))
		.sort((a, b) => a.name.localeCompare(b.name, "de"));
});

const moveBrowseBreadcrumbs = computed(() => {
	const crumbs: GlobalFolder[] = [];
	if (!moveBrowseFolderId.value) return crumbs;
	
	let folder = folders.value.find(f => f.id === moveBrowseFolderId.value);
	while (folder) {
		crumbs.unshift(folder);
		folder = folders.value.find(f => f.id === folder.parentId);
	}
	return crumbs;
});

const hasSelection = computed(() => selectedFiles.value.length > 0 || selectedFolders.value.length > 0);

const isAllSelected = computed(() => {
	const totalItems = sortedFiles.value.length + currentSubfolders.value.length;
	return totalItems > 0 && selectedFiles.value.length + selectedFolders.value.length === totalItems;
});

const isSomeSelected = computed(() => {
	return hasSelection.value && !isAllSelected.value;
});

const toggleSelectAll = () => {
	if (isAllSelected.value) {
		selectedFiles.value = [];
		selectedFolders.value = [];
	} else {
		selectedFiles.value = [...sortedFiles.value];
		selectedFolders.value = [...currentSubfolders.value];
	}
};

const totalItemsInFolder = computed(() => sortedFiles.value.length + currentSubfolders.value.length);

const folderFileCount = (folderId: string) => 
	files.value.filter(f => f.folderId === folderId).length;

const folderImageCount = (folderId: string) => 
	files.value.filter(f => f.folderId === folderId && f.type.startsWith("image/")).length;

const navigateToFolder = (folderId: string | null) => {
	currentFolderId.value = folderId;
	selectedFiles.value = [];
	selectedFolders.value = [];
	cancelFolderCreation();
	
	const basePath = route.path || "/documents";
	const url = folderId 
		? `${basePath}?folder=${folderId}`
		: basePath;
	history.pushState({}, "", url);
	
	fetchData(folderId);
};

const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return date.toLocaleDateString(dateLocale.value, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
};

const formatTimestamp = (timestamp: number) => {
	const date = new Date(timestamp);
	return date.toLocaleDateString(dateLocale.value, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
};

const isPdfFile = (file: GlobalFile | null) => file?.type === "application/pdf";
const isOfficePreviewable = (file: GlobalFile | null) => {
	if (!file) return false;
	return [
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	].includes(file.type);
};

const officePreviewUrl = computed(() => {
	if (!previewUrl.value || !isOfficePreviewable(previewFile.value)) return "";
	return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl.value)}`;
});

const buildDeepLinkPath = (params: { folderId?: string | null; fileId?: string | null }) => {
	const targetUrl = new URL(deepLinkBasePath.value, window.location.origin);
	if (params.folderId) {
		targetUrl.searchParams.set("folder", params.folderId);
	}
	if (params.fileId) {
		targetUrl.searchParams.set("fileId", params.fileId);
	}

	return targetUrl.toString();
};

const copyDeepLink = async (params: { folderId?: string | null; fileId?: string | null }) => {
	await navigator.clipboard.writeText(buildDeepLinkPath(params));
	toast.add({ title: t("documents.toasts.linkCopied"), color: "success" });
};

const downloadTranslatedFile = async (file: GlobalFile) => {
	if (!canDownloadTranslatedFile.value) return;

	try {
		const response = await fetch(`/api/files/translated-download?fileId=${encodeURIComponent(file.id)}&locale=${encodeURIComponent(activePreviewLocale.value)}`, {
			headers: { Authorization: `Bearer ${token.value}` },
		});

		if (!response.ok) {
			throw new Error(await response.text().catch(() => ""));
		}

		const blob = await response.blob();
		const downloadUrl = window.URL.createObjectURL(blob);
		const disposition = response.headers.get("content-disposition") || "";
		const fileName = disposition.match(/filename="([^"]+)"/)?.[1]
			|| `${file.name}-${activePreviewLocale.value}-translated.html`;
		const link = document.createElement("a");
		link.href = downloadUrl;
		link.download = fileName;
		link.style.display = "none";
		document.body.appendChild(link);
		link.click();
		setTimeout(() => {
			document.body.removeChild(link);
			window.URL.revokeObjectURL(downloadUrl);
		}, 100);
	} catch (e: unknown) {
		toast.add({
			title: t("documents.toasts.translatedUnavailable"),
			description: getErrorMessage(e),
			color: "error",
		});
	}
};

const focusHighlightedFile = async () => {
	if (!highlightedFileId.value) return;

	const highlightedFile = files.value.find((file) => file.id === highlightedFileId.value);
	if (!highlightedFile) return;

	selectedFolders.value = [];
	selectedFiles.value = [highlightedFile];

	await nextTick();
	const target = document.querySelector(`[data-file-id="${highlightedFile.id}"]`);
	if (target instanceof HTMLElement) {
		target.scrollIntoView({ block: "nearest", behavior: "smooth" });
	}
};

const loadDocumentProcessing = async (file: GlobalFile | null) => {
	documentProcessing.value = null;
	processingError.value = null;

	if (!file) return;

	try {
		processingLoading.value = true;
		const response = await $fetch<{ processing: DocumentProcessingState | null }>(`/api/files/processing`, {
			headers: { Authorization: `Bearer ${token.value}` },
			query: {
				fileId: file.id,
				locale: activePreviewLocale.value,
			},
		});
		documentProcessing.value = response.processing || null;
	} catch (e: unknown) {
		processingError.value = getFetchError(e) || t("documents.processing.unavailable");
	} finally {
		processingLoading.value = false;
	}
};

const loadPreview = async (file: GlobalFile | null) => {
	previewFile.value = file;
	previewUrl.value = null;
	await loadDocumentProcessing(file);

	if (!file) return;
	if (!(file.type.startsWith("image/") || file.type === "video/mp4" || isPdfFile(file) || isOfficePreviewable(file))) {
		return;
	}

	try {
		previewLoading.value = true;
		const response = await $fetch<{ url: string }>(`/api/files/download?fileId=${file.id}`, {
			headers: { Authorization: `Bearer ${token.value}` },
		});
		previewUrl.value = response.url;
	} catch (e: unknown) {
		toast.add({ title: t("documents.toasts.previewUnavailable"), description: getErrorMessage(e), color: "warning" });
	} finally {
		previewLoading.value = false;
	}
};

const getFolderDeleteSummary = async (folderId: string) => {
	return await $fetch<{ fileCount: number; folderCount: number }>("/api/folders/delete", {
		method: "POST",
		headers: { Authorization: `Bearer ${token.value}` },
		body: { folderId, dryRun: true },
	});
};

const fetchData = async (folderId: string | null = null) => {
	try {
		await waitForAuth();
		loading.value = true;
		error.value = null;
		files.value = [];
		cursor.value = null;
		hasMore.value = false;
		
		const data = await $fetch("/api/files", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { 
				folderId,
				limit: PAGE_SIZE,
				sortBy: sortBy.value,
				sortOrder: sortOrder.value
			},
		});
		files.value = data.files || [];
		folders.value = data.folders || [];
		cursor.value = data.nextCursor || null;
		hasMore.value = data.hasMore || false;
		await focusHighlightedFile();
		
		const hasImages = (data.files || []).some((f: GlobalFile) => 
			f.folderId === folderId && f.type.startsWith("image/")
		);
		viewMode.value = hasImages ? "grid" : "list";
	} catch (e: unknown) {
		error.value = getFetchError(e) || t("documents.states.loadError");
	} finally {
		loading.value = false;
	}
};

const loadMore = async () => {
	if (isLoadingMore.value || !hasMore.value || !cursor.value) return;
	
	try {
		isLoadingMore.value = true;
		const data = await $fetch("/api/files", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { 
				folderId: currentFolderId.value,
				limit: PAGE_SIZE,
				cursor: cursor.value,
				sortBy: sortBy.value,
				sortOrder: sortOrder.value
			},
		});
		
		files.value = [...files.value, ...(data.files || [])];
		cursor.value = data.nextCursor || null;
		hasMore.value = data.hasMore || false;
	} catch (e: unknown) {
		toast.add({ 
			title: t("documents.toasts.loadMoreError"), 
			description: getFetchError(e), 
			color: "error" 
		});
	} finally {
		isLoadingMore.value = false;
	}
};

let observer: IntersectionObserver | null = null;

const setupObserver = () => {
	if (observer) {
		observer.disconnect();
	}
	
	observer = new IntersectionObserver(
		(entries) => {
			if (entries[0].isIntersecting && hasMore.value && !isLoadingMore.value) {
				loadMore();
			}
		},
		{ rootMargin: "400px" }
	);
	
	if (sentinelRef.value) {
		observer.observe(sentinelRef.value);
	}
};

watch(sentinelRef, (newRef) => {
	if (newRef && observer) {
		observer.observe(newRef);
	}
});

const handleFileDrop = (e: DragEvent) => {
	if (!canManageDocuments.value) return;
	dragover.value = false;
	const droppedFiles = e.dataTransfer?.files;
	if (droppedFiles) {
		uploadFiles(Array.from(droppedFiles));
	}
};

const handleFileSelect = (e: Event) => {
	if (!canManageDocuments.value) return;
	const target = e.target as HTMLInputElement;
	if (target.files) {
		uploadFiles(Array.from(target.files));
	}
	(target as HTMLInputElement).value = "";
};

const uploadSingleFile = async (file: File): Promise<void> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = async () => {
			try {
				const base64 = reader.result as string;
				await $fetch("/api/files/upload", {
					method: "POST",
					headers: { Authorization: `Bearer ${token.value}` },
					body: {
						file: base64,
						name: file.name,
						type: file.type,
						size: file.size,
						folderId: currentFolderId.value,
						lastModified: file.lastModified,
					},
				});
				resolve();
			} catch (e: unknown) {
				reject(e);
			}
		};
		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsDataURL(file);
	});
};

const uploadFiles = async (fileList: File[]) => {
	if (fileList.length === 0) return;

	uploadQueue.value = {
		total: fileList.length,
		completed: 0,
		currentFile: null,
		isUploading: true,
	};

	const CONCURRENCY_LIMIT = 3;
	let errorCount = 0;

	const uploadWithConcurrency = async (files: File[]) => {
		const results: { success: boolean; fileName: string }[] = [];
		
		for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
			const batch = files.slice(i, i + CONCURRENCY_LIMIT);
			
			const batchResults = await Promise.allSettled(
				batch.map(async (file) => {
					uploadQueue.value.currentFile = file.name;
					await uploadSingleFile(file);
					return { success: true, fileName: file.name };
				})
			);

			for (const result of batchResults) {
				if (result.status === "fulfilled") {
					results.push(result.value);
					uploadQueue.value.completed++;
				} else {
					errorCount++;
					console.error("Upload failed:", result.reason);
				}
			}
		}
		
		return results;
	};

	await uploadWithConcurrency(fileList);

	uploadQueue.value.isUploading = false;
	uploadQueue.value.currentFile = null;

	await fetchData(currentFolderId.value);

	const successCount = uploadQueue.value.completed;
	if (errorCount > 0) {
		toast.add({
			title: `${successCount}/${fileList.length} Dateien hochgeladen`,
			description: `${errorCount} fehlgeschlagen`,
			color: "warning",
		});
	} else {
		toast.add({
			title: `${successCount} Datei${successCount !== 1 ? "en" : ""} hochgeladen`,
			color: "success",
		});
	}
};

const createFolderInline = () => {
	const tempId = `temp-${Date.now()}`;
	const newFolder: GlobalFolder = {
		id: tempId,
		name: t("documents.actions.newFolder"),
		parentId: currentFolderId.value,
		createdAt: new Date().toISOString(),
		createdBy: "",
	};
	
	tempFolders.value.push(newFolder);
	editingFolderId.value = tempId;
	editingFolderName.value = t("documents.actions.newFolder");
	
	nextTick(() => {
		const input = document.querySelector('.folder-name-input') as HTMLInputElement;
		input?.focus();
		input?.select();
	});
};

const saveFolderName = async (folderId: string) => {
	if (!editingFolderName.value.trim()) {
		return;
	}
	
	const isNewFolder = tempFolders.value.some(f => f.id === folderId);
	
	try {
		if (isNewFolder) {
			await $fetch("/api/folders/create", {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: {
					name: editingFolderName.value.trim(),
					parentId: currentFolderId.value,
				},
			});
			tempFolders.value = tempFolders.value.filter(f => f.id !== folderId);
			toast.add({ title: t("documents.toasts.folderCreated"), color: "success" });
		} else {
			await $fetch("/api/folders/rename", {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: {
					folderId: folderId,
					newName: editingFolderName.value.trim(),
				},
			});
			toast.add({ title: t("documents.toasts.folderRenamed"), color: "success" });
		}
		
		editingFolderId.value = null;
		await fetchData(currentFolderId.value);
	} catch (e: unknown) {
		toast.add({ title: t("documents.toasts.saveError"), description: getErrorMessage(e), color: "error" });
	}
};

const cancelFolderCreation = () => {
	tempFolders.value = [];
	editingFolderId.value = null;
};

const handleFolderKeydown = (e: KeyboardEvent, folderId: string) => {
	if (e.key === "Enter") {
		saveFolderName(folderId);
	} else if (e.key === "Escape") {
		const isNewFolder = tempFolders.value.some(f => f.id === folderId);
		if (isNewFolder) {
			tempFolders.value = tempFolders.value.filter(f => f.id !== folderId);
		}
		editingFolderId.value = null;
	}
};

const toggleFileSelection = (file: GlobalFile) => {
	const index = selectedFiles.value.findIndex(f => f.id === file.id);
	if (index === -1) {
		selectedFiles.value.push(file);
	} else {
		selectedFiles.value.splice(index, 1);
	}
};

const toggleFolderSelection = (folder: GlobalFolder) => {
	const index = selectedFolders.value.findIndex(f => f.id === folder.id);
	if (index === -1) {
		selectedFolders.value.push(folder);
	} else {
		selectedFolders.value.splice(index, 1);
	}
};

const isFileSelected = (file: GlobalFile) => {
	return selectedFiles.value.some(f => f.id === file.id);
};

const isFolderSelected = (folder: GlobalFolder) => {
	return selectedFolders.value.some(f => f.id === folder.id);
};

const openGallery = (file: GlobalFile) => {
	const index = sortedImages.value.findIndex(f => f.id === file.id);
	if (index !== -1) {
		galleryIndex.value = index;
		galleryOpen.value = true;
	}
};

const openVideo = (file: GlobalFile) => {
	currentVideo.value = file;
	videoOpen.value = true;
};

const handleFileClick = (file: GlobalFile) => {
	if (file.type.startsWith("image/")) {
		openGallery(file);
	} else if (file.type === "video/mp4") {
		openVideo(file);
	} else if (file.type === "application/pdf") {
		downloadFile(file);
	} else {
		downloadFileToDisk(file);
	}
};

const downloadFile = async (file: GlobalFile) => {
	try {
		downloadingFileId.value = file.id;
		const response = await $fetch<{ url: string }>(`/api/files/download?fileId=${file.id}`, {
			headers: { Authorization: `Bearer ${token.value}` },
		});
		
		const a = document.createElement("a");
		a.href = response.url;
		a.target = "_blank";
		a.rel = "noopener noreferrer";
		a.style.display = "none";
		document.body.appendChild(a);
		a.click();
		
		setTimeout(() => {
			document.body.removeChild(a);
		}, 100);
	} catch (e: unknown) {
		toast.add({ title: t("documents.toasts.openError"), description: getErrorMessage(e), color: "error" });
	} finally {
		downloadingFileId.value = null;
	}
};

const downloadFileToDisk = async (file: GlobalFile) => {
	try {
		downloadingFileId.value = file.id;
		const response = await $fetch<{ url: string }>(`/api/files/download?fileId=${file.id}`, {
			headers: { Authorization: `Bearer ${token.value}` },
		});
		
		const a = document.createElement("a");
		a.href = response.url;
		a.download = file.name;
		a.style.display = "none";
		document.body.appendChild(a);
		a.click();
		
		setTimeout(() => {
			document.body.removeChild(a);
		}, 100);
	} catch (e: unknown) {
		toast.add({ title: t("documents.toasts.downloadError"), description: getErrorMessage(e), color: "error" });
	} finally {
		downloadingFileId.value = null;
	}
};

const downloadSelectedFiles = async () => {
	for (const file of selectedFiles.value) {
		await downloadFileToDisk(file);
		await new Promise(resolve => setTimeout(resolve, 100));
	}
};

const deleteFile = async (file: GlobalFile) => {
	if (!confirm(t("documents.confirm.deleteFile", { name: file.name }))) return;

	try {
		await $fetch("/api/files/delete", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { fileId: file.id },
		});
		toast.add({ title: t("documents.toasts.fileDeleted"), color: "success" });
		selectedFiles.value = selectedFiles.value.filter(f => f.id !== file.id);
		fetchData(currentFolderId.value);
	} catch (e: unknown) {
		toast.add({ title: t("documents.toasts.deleteError"), description: getErrorMessage(e), color: "error" });
	}
};

const deleteSelectedItems = async () => {
	const total = selectedFiles.value.length + selectedFolders.value.length;
	let warningText = t("documents.confirm.deleteSelection", { count: total });

	if (selectedFolders.value.length > 0) {
		const summaries = await Promise.all(selectedFolders.value.map(folder => getFolderDeleteSummary(folder.id)));
		const nestedFiles = summaries.reduce((sum, summary) => sum + summary.fileCount, 0);
		const nestedFolders = summaries.reduce((sum, summary) => sum + summary.folderCount, 0);
		if (nestedFiles > 0 || nestedFolders > 0) {
			warningText += `\n\n${t("documents.confirm.deleteSelectionNested", { files: nestedFiles, folders: nestedFolders })}`;
		}
	}

	if (!confirm(warningText)) return;

	let deletedCount = 0;

	for (const folder of [...selectedFolders.value]) {
		try {
			const result = await $fetch<{ fileCount: number; folderCount: number }>("/api/folders/delete", {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: { folderId: folder.id },
			});
			deletedCount += 1 + result.folderCount + result.fileCount;
		} catch (e: unknown) {
			toast.add({ title: t("documents.toasts.deleteNamedError", { name: folder.name }), description: getFetchError(e), color: "error" });
		}
	}

	for (const file of [...selectedFiles.value]) {
		try {
			await $fetch("/api/files/delete", {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: { fileId: file.id },
			});
			deletedCount++;
		} catch (e: unknown) {
			toast.add({ title: t("documents.toasts.deleteNamedError", { name: file.name }), description: getFetchError(e), color: "error" });
		}
	}

	if (deletedCount > 0) {
		toast.add({ title: t("documents.toasts.selectionDeleted", { count: deletedCount }), color: "success" });
	}
	selectedFiles.value = [];
	selectedFolders.value = [];
	fetchData(currentFolderId.value);
};

const deleteFolder = async (folder: GlobalFolder) => {
	const summary = await getFolderDeleteSummary(folder.id);
	let warningText = t("documents.confirm.deleteFolder", { name: folder.name });
	if (summary.fileCount > 0 || summary.folderCount > 0) {
		warningText += `\n\n${t("documents.confirm.deleteFolderNested", { files: summary.fileCount, folders: summary.folderCount })}`;
	}

	if (!confirm(warningText)) return;

	try {
		const result = await $fetch<{ fileCount: number; folderCount: number }>("/api/folders/delete", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { folderId: folder.id },
		});
		toast.add({
			title: "Ordner gelöscht",
			description: result.fileCount > 0 || result.folderCount > 0
				? t("documents.toasts.folderDeletedDetail", { files: result.fileCount, folders: result.folderCount })
				: undefined,
			color: "success",
		});
		selectedFolders.value = selectedFolders.value.filter(f => f.id !== folder.id);
		fetchData(currentFolderId.value);
	} catch (e: unknown) {
		toast.add({ title: t("documents.toasts.deleteError"), description: getErrorMessage(e), color: "error" });
	}
};

const getFolderMenuItems = (folder: GlobalFolder) => {
	const items = [[{
		label: t("documents.actions.copyLink"),
		icon: "i-lucide-link",
		onSelect: () => copyDeepLink({ folderId: folder.id }),
	}]];

	if (!$isAdmin.value && !canDeleteFolder(folder)) {
		return items;
	}

	const adminItems = $isAdmin.value
		? [[{
			label: t("documents.actions.rename"),
			icon: "i-lucide-pencil",
			onSelect: () => {
				editingFolderId.value = folder.id;
				editingFolderName.value = folder.name;
				nextTick(() => {
					const input = document.querySelector(".folder-name-input") as HTMLInputElement;
					input?.focus();
					input?.select();
				});
			},
		}, {
			label: t("documents.actions.move"),
			icon: "i-lucide-folder-input",
			onSelect: () => {
				selectedFolders.value = [folder];
				selectedFiles.value = [];
				openMoveModal();
			},
		}]]
		: [];

	const deleteItems = canDeleteFolder(folder)
		? [[{
			label: t("documents.actions.delete"),
			icon: "i-lucide-trash-2",
			onSelect: () => deleteFolder(folder),
		}]]
		: [];

	return [
		...adminItems,
		...items,
		...deleteItems,
	];
};

const getFileMenuItems = (file: GlobalFile) => {
	const items = [[{
		label: file.type.startsWith("image/")
			? t("documents.actions.view")
			: file.type === "video/mp4"
				? t("documents.actions.play")
				: file.type === "application/pdf"
					? t("documents.actions.open")
					: t("documents.actions.download"),
		icon: file.type.startsWith("image/") ? "i-lucide-eye" : file.type === "video/mp4" ? "i-lucide-play" : file.type === "application/pdf" ? "i-lucide-external-link" : "i-lucide-download",
		onSelect: () => handleFileClick(file),
	}],
	[{
		label: t("documents.actions.download"),
		icon: "i-lucide-download",
		onSelect: () => downloadFileToDisk(file),
	}, {
		label: t("documents.actions.copyLink"),
		icon: "i-lucide-link",
		onSelect: () => copyDeepLink({ folderId: file.folderId, fileId: file.id }),
	}]];

	if (!$isAdmin.value && !canDeleteFile(file)) {
		return items;
	}

	const adminItems = $isAdmin.value
		? [[{
			label: t("documents.actions.rename"),
			icon: "i-lucide-pencil",
			onSelect: () => {
				selectedFiles.value = [file];
				selectedFolders.value = [];
				openRenameModal();
			},
		}, {
			label: t("documents.actions.move"),
			icon: "i-lucide-folder-input",
			onSelect: () => {
				selectedFiles.value = [file];
				selectedFolders.value = [];
				openMoveModal();
			},
		}]]
		: [];

	const deleteItems = canDeleteFile(file)
		? [[{
			label: t("documents.actions.delete"),
			icon: "i-lucide-trash-2",
			onSelect: () => deleteFile(file),
		}]]
		: [];

	return [
		...items,
		...adminItems,
		...deleteItems,
	];
};

const openRenameModal = () => {
	if (selectedFiles.value.length !== 1) return;
	renameValue.value = selectedFiles.value[0].name;
	isRenameModalOpen.value = true;
};

const renameFile = async () => {
	if (selectedFiles.value.length !== 1 || !renameValue.value.trim()) return;

	const file = selectedFiles.value[0];
	isSaving.value = true;
	try {
		await $fetch("/api/files/rename", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: {
				fileId: file.id,
				newName: renameValue.value.trim(),
			},
		});
		toast.add({ title: t("documents.toasts.fileRenamed"), color: "success" });
		isRenameModalOpen.value = false;
		selectedFiles.value = [];
		fetchData(currentFolderId.value);
	} catch (e: unknown) {
		toast.add({ title: t("documents.toasts.renameError"), description: getErrorMessage(e), color: "error" });
	} finally {
		isSaving.value = false;
	}
};

const moveItems = async (targetFolderId: string | null) => {
	if (selectedFiles.value.length === 0 && selectedFolders.value.length === 0) return;

	isSaving.value = true;
	let successCount = 0;

	for (const file of selectedFiles.value) {
		try {
			await $fetch("/api/files/move", {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: {
					fileId: file.id,
					targetFolderId,
				},
			});
			successCount++;
		} catch (e: unknown) {
			toast.add({ title: t("documents.toasts.moveNamedError", { name: file.name }), description: getErrorMessage(e), color: "error" });
		}
	}

	for (const folder of selectedFolders.value) {
		try {
			await $fetch("/api/folders/move", {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: {
					folderId: folder.id,
					targetParentId: targetFolderId,
				},
			});
			successCount++;
		} catch (e: unknown) {
			toast.add({ title: t("documents.toasts.moveNamedError", { name: folder.name }), description: getErrorMessage(e), color: "error" });
		}
	}
	
	if (successCount > 0) {
		toast.add({ title: t("documents.toasts.itemsMoved", { count: successCount }), color: "success" });
	}
	isMoveModalOpen.value = false;
	selectedFiles.value = [];
	selectedFolders.value = [];
	moveBrowseFolderId.value = null;
	fetchData(currentFolderId.value);
	isSaving.value = false;
};

const openMoveModal = () => {
	moveBrowseFolderId.value = null;
	isMoveModalOpen.value = true;
};

const navigateMoveBrowse = (folderId: string | null) => {
	moveBrowseFolderId.value = folderId;
};

const navigateMoveBrowseUp = () => {
	if (!moveBrowseFolderId.value) return;
	const currentFolder = folders.value.find(f => f.id === moveBrowseFolderId.value);
	if (currentFolder?.parentId) {
		moveBrowseFolderId.value = currentFolder.parentId;
	} else {
		moveBrowseFolderId.value = null;
	}
};

const toggleSort = (column: "name" | "date" | "size") => {
	if (sortBy.value === column) {
		sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
	} else {
		sortBy.value = column;
		sortOrder.value = column === "date" ? "desc" : "asc";
	}
	fetchData(currentFolderId.value);
};

const clearSelection = () => {
	selectedFiles.value = [];
	selectedFolders.value = [];
};

onMounted(async () => {
	const folderFromUrl = route.query.folder as string | undefined;
	if (folderFromUrl) {
		currentFolderId.value = folderFromUrl;
	}
	await fetchData(currentFolderId.value);
	setupObserver();
});

onUnmounted(() => {
	if (observer) {
		observer.disconnect();
	}
});

watch(() => route.query.folder, (newFolderId) => {
	const folderId = (newFolderId as string) || null;
	if (folderId !== currentFolderId.value) {
		currentFolderId.value = folderId;
		fetchData(folderId);
	}
});

watch(highlightedFileId, () => {
	if (highlightedFileId.value) {
		focusHighlightedFile();
	}
});

watch(activePreviewLocale, () => {
	if (previewFile.value) {
		loadDocumentProcessing(previewFile.value);
	}
});

watch(
	() => selectedFiles.value.map(file => file.id),
	async () => {
		if (selectedFiles.value.length === 1 && selectedFolders.value.length === 0) {
			await loadPreview(selectedFiles.value[0]);
			return;
		}
		previewFile.value = null;
		previewUrl.value = null;
	},
);

watch(
	() => selectedFolders.value.length,
	() => {
		if (selectedFolders.value.length > 0) {
			previewFile.value = null;
			previewUrl.value = null;
		}
	},
);

useHead({
	title: t("nav.documents"),
});
</script>

<template>
	<div class="min-h-screen pb-20 lg:pb-0">
		<div class="max-w-screen-xl mx-auto px-4 py-6 md:py-8">
			<div class="flex items-center justify-between mb-6 md:mb-8 gap-4">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)] mb-2">{{ t("nav.documents") }}</p>
					<h1 class="display-copy text-3xl md:text-4xl font-bold tracking-[-0.04em]">{{ t("documents.title") }}</h1>
					<p class="app-muted text-sm md:text-base mt-2 hidden sm:block">{{ t("documents.subtitle") }}</p>
				</div>
				<div v-if="canManageDocuments" class="flex items-center gap-2 shrink-0">
					<UButton
						variant="soft"
						color="neutral"
						icon="i-lucide-folder-plus"
						@click="createFolderInline"
					>
						<span class="hidden sm:inline">{{ t("documents.actions.newFolder") }}</span>
					</UButton>
					<label class="cursor-pointer">
						<UButton
							as="span"
							color="primary"
							icon="i-lucide-upload"
							:loading="uploadQueue.isUploading"
						>
							<span class="hidden sm:inline">{{ t("documents.actions.upload") }}</span>
						</UButton>
						<input type="file" multiple accept="image/*,video/mp4,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar" class="hidden" @change="handleFileSelect" />
					</label>
					<span class="text-xs text-stone-400 hidden sm:inline">{{ t("documents.maxFileSize") }}</span>
				</div>
			</div>

			<div v-if="uploadQueue.isUploading" class="mb-6 rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4 dark:border-stone-700 dark:bg-stone-800/70 md:bg-white md:dark:bg-stone-800">
				<div class="flex items-center gap-4">
					<div class="flex-1">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm font-medium text-stone-700 dark:text-stone-300">
								{{ t("documents.states.uploadingCurrent", { file: uploadQueue.currentFile }) }}
							</span>
							<span class="text-sm text-stone-500">
								{{ uploadQueue.completed }}/{{ uploadQueue.total }}
							</span>
						</div>
						<div class="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
							<div 
								class="h-full bg-primary transition-all duration-300 rounded-full"
								:style="{ width: `${(uploadQueue.completed / uploadQueue.total) * 100}%` }"
							/>
						</div>
					</div>
				</div>
			</div>

			<div v-if="loading" class="flex items-center justify-center py-20">
				<div class="text-center space-y-4">
					<div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
					<p class="text-stone-500 font-medium">{{ t("documents.states.loading") }}</p>
				</div>
			</div>

			<div v-else-if="error" class="text-center py-20">
				<div class="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
					<UIcon name="i-lucide-alert-circle" class="w-10 h-10 text-red-500" />
				</div>
				<h2 class="text-xl font-bold text-red-600 mb-4">{{ error }}</h2>
				<UButton color="neutral" variant="soft" @click="fetchData">{{ t("documents.actions.retry") }}</UButton>
			</div>

			<template v-else>
				<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
				<div class="-mx-4 overflow-hidden md:mx-0 md:rounded-[2rem] md:border md:border-[var(--app-border)] md:bg-[var(--app-surface-strong)] md:shadow-[var(--app-shadow)]">
					<div class="px-4 md:px-6 py-3 md:py-4 border-b border-stone-100 dark:border-stone-800 overflow-x-auto bg-white/80 dark:bg-stone-900/50 md:bg-transparent">
						<div class="flex items-center gap-2 text-sm whitespace-nowrap">
							<button
								v-if="currentFolderId"
								@click="navigateToFolder(breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].id : null)"
								class="flex items-center gap-1 text-stone-600 dark:text-stone-400 hover:text-primary transition-colors"
							>
								<UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
							</button>
							<button
								@click="navigateToFolder(null)"
								class="flex items-center gap-1 text-stone-600 dark:text-stone-400 hover:text-primary transition-colors"
								:class="{ 'text-primary font-bold': !currentFolderId }"
							>
								<span>{{ t("nav.documents") }}</span>
							</button>
							<template v-for="(folder, index) in breadcrumbs" :key="folder.id">
								<UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-stone-400" />
								<button
									@click="navigateToFolder(folder.id)"
									class="flex items-center gap-1 text-stone-600 dark:text-stone-400 hover:text-primary transition-colors"
									:class="{ 'text-primary font-bold': index === breadcrumbs.length - 1 }"
								>
									<span>{{ folder.name }}</span>
								</button>
							</template>
						</div>
					</div>

					<div class="px-4 md:px-6 py-2 md:py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-4 bg-white/80 dark:bg-stone-900/50 md:bg-transparent">
						<div class="flex items-center gap-2">
							<div class="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
								<UButton
									:variant="viewMode === 'grid' ? 'solid' : 'ghost'"
									color="neutral"
									icon="i-lucide-grid-3x3"
									size="sm"
									@click="viewMode = 'grid'"
								/>
								<UButton
									:variant="viewMode === 'list' ? 'solid' : 'ghost'"
									color="neutral"
									icon="i-lucide-list"
									size="sm"
									@click="viewMode = 'list'"
								/>
							</div>
						</div>
						<div class="flex items-center gap-2 text-xs">
							<span class="text-stone-500 hidden sm:inline">{{ t("documents.sort.label") }}</span>
							<UFieldGroup size="xs">
								<UButton
									:variant="sortBy === 'name' ? 'soft' : 'ghost'"
									color="neutral"
									@click="toggleSort('name')"
								>
									{{ t("documents.sort.name") }}
									<UIcon v-if="sortBy === 'name'" :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="w-3 h-3 ml-1" />
								</UButton>
								<UButton
									:variant="sortBy === 'date' ? 'soft' : 'ghost'"
									color="neutral"
									@click="toggleSort('date')"
								>
									{{ t("documents.sort.date") }}
									<UIcon v-if="sortBy === 'date'" :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="w-3 h-3 ml-1" />
								</UButton>
								<UButton
									:variant="sortBy === 'size' ? 'soft' : 'ghost'"
									color="neutral"
									@click="toggleSort('size')"
								>
									{{ t("documents.sort.size") }}
									<UIcon v-if="sortBy === 'size'" :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="w-3 h-3 ml-1" />
								</UButton>
							</UFieldGroup>
						</div>
					</div>

					<div v-if="hasSelection" class="flex flex-wrap items-center gap-2 px-4 md:px-6 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800">
						<UIcon name="i-lucide-files" class="w-5 h-5 text-primary shrink-0" />
						<span class="text-sm font-medium text-primary">
							{{ t("documents.selection.summary", { selected: selectedFiles.length + selectedFolders.length, total: totalItemsInFolder }) }}
						</span>
						<div class="flex-1" />
						<div class="flex items-center gap-1">
							<UButton v-if="selectedFiles.length > 0" size="sm" variant="ghost" color="neutral" @click="downloadSelectedFiles" icon="i-lucide-download">
								<span class="hidden md:inline">{{ t("documents.actions.download") }}</span>
							</UButton>
							<UButton v-if="$isAdmin && selectedFiles.length === 1 && selectedFolders.length === 0" size="sm" variant="ghost" color="neutral" @click="openRenameModal" icon="i-lucide-pencil">
								<span class="hidden md:inline">{{ t("documents.actions.rename") }}</span>
							</UButton>
							<UButton v-if="$isAdmin" size="sm" variant="ghost" color="neutral" @click="openMoveModal" icon="i-lucide-folder-input">
								<span class="hidden md:inline">{{ t("documents.actions.move") }}</span>
							</UButton>
							<UButton size="sm" variant="ghost" color="error" :disabled="!canDeleteSelection" @click="deleteSelectedItems" icon="i-lucide-trash-2">
								<span class="hidden md:inline">{{ t("documents.actions.delete") }}</span>
							</UButton>
							<UButton size="sm" variant="ghost" color="neutral" icon="i-lucide-x" @click="clearSelection" />
						</div>
					</div>

					<div
						class="min-h-[300px] bg-transparent md:bg-transparent"
						:class="{ 'border-2 border-dashed border-primary bg-primary-50 dark:bg-primary-900/10': dragover && canManageDocuments }"
						@dragover.prevent="dragover = true"
						@dragleave.prevent="dragover = false"
						@drop.prevent="handleFileDrop"
					>
						<div v-if="sortedSubfolders.length === 0 && sortedFiles.length === 0" class="flex flex-col items-center justify-center py-16 md:py-20 text-stone-400">
							<UIcon name="i-lucide-folder-open" class="w-12 h-12 md:w-16 md:h-16 mb-4" />
							<p class="font-medium text-base md:text-lg">{{ t("documents.states.emptyTitle") }}</p>
							<p v-if="canManageDocuments" class="text-xs md:text-sm mt-2 text-center px-4">{{ t("documents.states.emptyHint") }}</p>
						</div>

						<div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 p-3 md:p-6">
							<div
							v-for="folder in sortedSubfolders"
								:key="folder.id"
								class="group relative p-3 md:p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border transition-all text-center shadow-sm hover:shadow-md md:bg-white"
								:class="isFolderSelected(folder) ? 'border-primary ring-2 ring-primary/20' : 'border-stone-200 dark:border-stone-700 hover:border-primary'"
							>
								<button
									v-if="!editingFolderId || editingFolderId !== folder.id"
									class="absolute top-2 left-2 w-10 h-10 flex items-center justify-center z-10"
									@click.stop="toggleFolderSelection(folder)"
								>
									<div
										class="w-6 h-6 rounded border-2 flex items-center justify-center transition-colors"
										:class="isFolderSelected(folder) ? 'bg-primary border-primary' : 'border-stone-300 dark:border-stone-500 bg-white dark:bg-stone-800 hover:border-primary'"
									>
										<UIcon v-if="isFolderSelected(folder)" name="i-lucide-check" class="w-4 h-4 text-white" />
									</div>
								</button>
								<UDropdownMenu v-if="(!editingFolderId || editingFolderId !== folder.id)" :items="getFolderMenuItems(folder)" :ui="{ content: 'min-w-36' }">
									<button
										class="absolute top-2 right-2 w-10 h-10 flex items-center justify-center z-10"
										@click.stop
									>
										<div class="w-8 h-8 rounded-full bg-white dark:bg-stone-800 shadow-md hover:bg-stone-100 dark:hover:bg-stone-700 transition-all flex items-center justify-center">
											<UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-stone-500" />
										</div>
									</button>
								</UDropdownMenu>
								
								<div v-if="editingFolderId === folder.id" class="w-full" @click.stop>
									<div class="aspect-[4/3] rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-2 md:mb-3">
										<UIcon name="i-lucide-folder" class="w-8 h-8 md:w-12 md:h-12 text-primary" />
									</div>
									<input
										v-model="editingFolderName"
										type="text"
										class="folder-name-input w-full px-2 py-1 text-xs md:text-sm bg-white dark:bg-stone-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center"
										@keydown="handleFolderKeydown($event, folder.id)"
										@blur="saveFolderName(folder.id)"
									/>
								</div>
								<button v-else class="w-full" @click="navigateToFolder(folder.id)">
									<div class="aspect-[4/3] rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-2 md:mb-3">
										<UIcon name="i-lucide-folder" class="w-8 h-8 md:w-12 md:h-12 text-primary group-hover:scale-110 transition-transform" />
									</div>
									<p class="text-xs md:text-sm font-medium text-stone-700 dark:text-stone-300 truncate" :title="folder.name">{{ truncateFileName(folder.name) }}</p>
									<p class="text-[10px] text-stone-400 mt-0.5">
										<template v-if="folderImageCount(folder.id) > 0">{{ t("documents.count.images", { count: folderImageCount(folder.id) }) }}</template>
										<template v-if="folderImageCount(folder.id) > 0 && folderFileCount(folder.id) > 0"> · </template>
										<template v-if="folderFileCount(folder.id) > 0">{{ t("documents.count.files", { count: folderFileCount(folder.id) }) }}</template>
									</p>
								</button>
							</div>

							<div
							v-for="file in sortedFiles"
								:key="file.id"
								:data-file-id="file.id"
								class="group relative p-3 md:p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border transition-all text-center shadow-sm hover:shadow-md md:bg-white"
								:class="[
									isFileSelected(file)
										? 'border-primary ring-2 ring-primary/20'
										: 'border-stone-200 dark:border-stone-700 hover:border-primary',
									highlightedFileId === file.id ? 'ring-2 ring-primary border-primary' : ''
								]"
							>
								<button
									class="absolute top-2 left-2 w-10 h-10 flex items-center justify-center z-10"
									@click.stop="toggleFileSelection(file)"
								>
									<div
										class="w-6 h-6 rounded border-2 flex items-center justify-center transition-colors"
										:class="isFileSelected(file) ? 'bg-primary border-primary' : 'border-stone-300 dark:border-stone-500 bg-white dark:bg-stone-800 hover:border-primary'"
									>
										<UIcon v-if="isFileSelected(file)" name="i-lucide-check" class="w-4 h-4 text-white" />
									</div>
								</button>
								<UDropdownMenu :items="getFileMenuItems(file)" :ui="{ content: 'min-w-36' }">
									<button
										class="absolute top-2 right-2 w-10 h-10 flex items-center justify-center z-10"
										@click.stop
									>
										<div class="w-8 h-8 rounded-full bg-white dark:bg-stone-800 shadow-md hover:bg-stone-100 dark:hover:bg-stone-700 transition-all flex items-center justify-center">
											<UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-stone-500" />
										</div>
									</button>
								</UDropdownMenu>
								<button class="w-full" @click="handleFileClick(file)">
									<div v-if="file.type.startsWith('image/')" class="aspect-[4/3] rounded-xl overflow-hidden mb-2 md:mb-3 bg-stone-100 dark:bg-stone-700">
										<img :src="file.thumbnailUrl || file.url" :alt="file.name" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
									</div>
									<div v-else-if="file.type === 'video/mp4'" class="aspect-[4/3] rounded-xl flex items-center justify-center mb-2 md:mb-3 relative" :class="getFileIconBg(file.type)">
										<UIcon :name="getFileIcon(file.type)" class="w-8 h-8 md:w-12 md:h-12" :class="getFileIconColor(file.type)" />
										<div class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
											<div class="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
												<UIcon name="i-lucide-play" class="w-5 h-5 text-stone-800 ml-0.5" />
											</div>
										</div>
									</div>
									<div v-else class="aspect-[4/3] rounded-xl flex items-center justify-center mb-2 md:mb-3 relative" :class="getFileIconBg(file.type)">
										<UIcon :name="getFileIcon(file.type)" class="w-8 h-8 md:w-12 md:h-12" :class="getFileIconColor(file.type)" />
										<div class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
											<span class="px-2 py-1 text-xs font-medium bg-white/90 rounded-lg text-stone-700">{{ getFileTypeName(file.type) }}</span>
										</div>
									</div>
									<p class="text-xs md:text-sm font-medium text-stone-700 dark:text-stone-300 truncate" :title="file.name">{{ truncateFileName(file.name) }}</p>
									<p class="text-[10px] md:text-xs text-stone-400 mt-0.5">{{ formatDate(file.uploadedAt) }}</p>
								</button>
							</div>
							
							<div ref="sentinelRef" class="col-span-full flex justify-center py-4">
								<div v-if="isLoadingMore" class="flex items-center gap-2 text-stone-500">
									<div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
									<span class="text-sm">{{ t("documents.states.loadingMore") }}</span>
								</div>
							</div>
						</div>

						<div v-else class="p-3 md:p-6">
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead>
										<tr class="border-b border-stone-200 dark:border-stone-700 text-left">
											<th class="py-3 px-2 w-12">
												<button 
													class="w-6 h-6 rounded border flex items-center justify-center transition-colors"
													:class="isAllSelected ? 'bg-primary border-primary' : isSomeSelected ? 'bg-primary border-primary' : 'border-stone-300 dark:border-stone-600 hover:border-primary'"
													@click="toggleSelectAll"
												>
													<UIcon v-if="isAllSelected" name="i-lucide-check" class="w-4 h-4 text-white" />
													<UIcon v-else-if="isSomeSelected" name="i-lucide-minus" class="w-4 h-4 text-white" />
												</button>
											</th>
											<th class="py-3 px-2 font-medium text-stone-600 dark:text-stone-400">{{ t("documents.columns.name") }}</th>
											<th class="py-3 px-2 font-medium text-stone-600 dark:text-stone-400 hidden md:table-cell">{{ t("documents.columns.type") }}</th>
											<th class="py-3 px-2 font-medium text-stone-600 dark:text-stone-400 hidden sm:table-cell">{{ t("documents.columns.size") }}</th>
											<th class="py-3 px-2 font-medium text-stone-600 dark:text-stone-400 hidden lg:table-cell">{{ t("documents.columns.fileDate") }}</th>
											<th class="py-3 px-2 font-medium text-stone-600 dark:text-stone-400 hidden md:table-cell">{{ t("documents.columns.uploaded") }}</th>
											<th class="py-3 px-2 font-medium text-stone-600 dark:text-stone-400 hidden lg:table-cell">{{ t("documents.columns.from") }}</th>
											<th class="py-3 px-2 w-10"></th>
										</tr>
									</thead>
									<tbody>
										<tr
											v-for="folder in sortedSubfolders"
											:key="folder.id"
											class="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
											:class="{ 'bg-primary-50 dark:bg-primary-900/20': isFolderSelected(folder) }"
										>
											<td class="py-3 px-2">
												<button 
													v-if="!editingFolderId || editingFolderId !== folder.id"
													class="w-6 h-6 rounded border flex items-center justify-center transition-colors"
													:class="isFolderSelected(folder) ? 'bg-primary border-primary' : 'border-stone-300 dark:border-stone-600 hover:border-primary'"
													@click.stop="toggleFolderSelection(folder)"
												>
													<UIcon v-if="isFolderSelected(folder)" name="i-lucide-check" class="w-4 h-4 text-white" />
												</button>
											</td>
											<td class="py-3 px-2">
												<div v-if="editingFolderId === folder.id" class="flex items-center gap-2" @click.stop>
													<UIcon name="i-lucide-folder" class="w-5 h-5 text-primary shrink-0" />
													<input
														v-model="editingFolderName"
														type="text"
														class="folder-name-input flex-1 px-2 py-1 bg-white dark:bg-stone-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
														@keydown="handleFolderKeydown($event, folder.id)"
														@blur="saveFolderName(folder.id)"
													/>
												</div>
												<button v-else class="flex items-center gap-2 text-left w-full hover:text-primary transition-colors" @click="navigateToFolder(folder.id)">
													<UIcon name="i-lucide-folder" class="w-5 h-5 text-primary shrink-0" />
													<span class="font-medium truncate" :title="folder.name">{{ truncateFileName(folder.name) }}</span>
												</button>
											</td>
											<td class="py-3 px-2 hidden md:table-cell text-stone-500">
												<template v-if="folderImageCount(folder.id) > 0">{{ t("documents.count.images", { count: folderImageCount(folder.id) }) }}</template>
												<template v-if="folderImageCount(folder.id) > 0 && folderFileCount(folder.id) > 0">, </template>
												<template v-if="folderFileCount(folder.id) > 0">{{ t("documents.count.files", { count: folderFileCount(folder.id) }) }}</template>
												<template v-if="folderImageCount(folder.id) === 0 && folderFileCount(folder.id) === 0">{{ t("documents.columns.folder") }}</template>
											</td>
											<td class="py-3 px-2 hidden sm:table-cell text-stone-500">—</td>
											<td class="py-3 px-2 hidden lg:table-cell text-stone-500">—</td>
											<td class="py-3 px-2 hidden md:table-cell text-stone-500">{{ formatDate(folder.createdAt) }}</td>
											<td class="py-3 px-2 hidden lg:table-cell text-stone-500 truncate">{{ folder.createdByName || "—" }}</td>
											<td class="py-3 px-2">
												<UDropdownMenu v-if="(!editingFolderId || editingFolderId !== folder.id)" :items="getFolderMenuItems(folder)" :ui="{ content: 'min-w-36' }">
													<button class="w-8 h-8 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center" @click.stop>
														<UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-stone-500" />
													</button>
												</UDropdownMenu>
											</td>
										</tr>
										<tr
											v-for="file in sortedFiles"
											:key="file.id"
											:data-file-id="file.id"
											class="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
											:class="{
												'bg-primary-50 dark:bg-primary-900/20': isFileSelected(file) || highlightedFileId === file.id
											}"
										>
											<td class="py-3 px-2">
												<button 
													class="w-6 h-6 rounded border flex items-center justify-center transition-colors"
													:class="isFileSelected(file) ? 'bg-primary border-primary' : 'border-stone-300 dark:border-stone-600 hover:border-primary'"
													@click.stop="toggleFileSelection(file)"
												>
													<UIcon v-if="isFileSelected(file)" name="i-lucide-check" class="w-4 h-4 text-white" />
												</button>
											</td>
											<td class="py-3 px-2">
												<button class="flex items-center gap-2 text-left w-full hover:text-primary transition-colors" @click="handleFileClick(file)">
													<div v-if="file.type.startsWith('image/')" class="w-8 h-8 rounded overflow-hidden bg-stone-100 dark:bg-stone-700 shrink-0">
														<img :src="file.thumbnailUrl || file.url" :alt="file.name" loading="lazy" class="w-full h-full object-cover" />
													</div>
													<div v-else-if="file.type === 'video/mp4'" class="w-8 h-8 rounded flex items-center justify-center shrink-0 relative" :class="getFileIconBg(file.type)">
														<UIcon :name="getFileIcon(file.type)" class="w-4 h-4" :class="getFileIconColor(file.type)" />
													</div>
													<div v-else class="w-8 h-8 rounded flex items-center justify-center shrink-0" :class="getFileIconBg(file.type)">
														<UIcon :name="getFileIcon(file.type)" class="w-4 h-4" :class="getFileIconColor(file.type)" />
													</div>
													<span class="font-medium truncate" :title="file.name">{{ truncateFileName(file.name) }}</span>
												</button>
											</td>
											<td class="py-3 px-2 hidden md:table-cell text-stone-500 truncate">{{ getFileTypeName(file.type) }}</td>
											<td class="py-3 px-2 hidden sm:table-cell text-stone-500">{{ formatFileSize(file.size) }}</td>
											<td class="py-3 px-2 hidden lg:table-cell text-stone-500">{{ file.lastModified ? formatTimestamp(file.lastModified) : "—" }}</td>
											<td class="py-3 px-2 hidden md:table-cell text-stone-500">{{ formatDate(file.uploadedAt) }}</td>
											<td class="py-3 px-2 hidden lg:table-cell text-stone-500 truncate">{{ file.uploadedByName || "—" }}</td>
											<td class="py-3 px-2">
												<UDropdownMenu :items="getFileMenuItems(file)" :ui="{ content: 'min-w-36' }">
													<button class="w-8 h-8 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center" @click.stop>
														<UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-stone-500" />
													</button>
												</UDropdownMenu>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
							
							<div ref="sentinelRef" class="flex justify-center py-4">
								<div v-if="isLoadingMore" class="flex items-center gap-2 text-stone-500">
									<div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
									<span class="text-sm">Lade weitere...</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<aside class="space-y-4 xl:sticky xl:top-28">
					<div
						v-if="previewFile"
						class="overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-50/80 dark:border-stone-800 dark:bg-stone-900/50 md:rounded-[1.75rem] md:border-[var(--app-border)] md:bg-[var(--app-surface-strong)] md:shadow-[var(--app-shadow)]">
						<div class="border-b border-[var(--app-border)] px-5 py-4">
							<p class="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[var(--app-primary)]">{{ t("documents.preview.selectedFile") }}</p>
							<h2 class="mt-2 text-lg font-semibold text-[var(--app-text)] break-words">{{ previewFile.name }}</h2>
						</div>
						<div class="border-b border-[var(--app-border)] bg-white/75 p-4 dark:bg-white/[0.02] md:bg-black/3">
							<div class="overflow-hidden rounded-[1.25rem] bg-stone-100 dark:bg-stone-950">
								<div v-if="previewLoading" class="flex h-[220px] items-center justify-center">
									<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
								</div>
								<img
									v-else-if="previewUrl && previewFile.type.startsWith('image/')"
									:src="previewUrl"
									:alt="previewFile.name"
									class="h-[220px] w-full object-cover" />
								<video
									v-else-if="previewUrl && previewFile.type === 'video/mp4'"
									:src="previewUrl"
									controls
									class="h-[220px] w-full object-cover" />
								<iframe
									v-else-if="previewUrl && isPdfFile(previewFile)"
									:src="previewUrl"
									class="h-[320px] w-full bg-white"
									:title="t('documents.preview.pdfTitle')" />
								<iframe
									v-else-if="officePreviewUrl"
									:src="officePreviewUrl"
									class="h-[320px] w-full bg-white"
									:title="t('documents.preview.documentTitle')" />
								<div
									v-else
									class="flex h-[220px] flex-col items-center justify-center gap-3 px-6 text-center text-stone-500 dark:text-stone-400">
									<UIcon :name="getFileIcon(previewFile.type)" class="h-10 w-10" :class="getFileIconColor(previewFile.type)" />
									<p class="font-medium text-[var(--app-text)]">{{ previewFile.name }}</p>
									<p class="text-sm">{{ t("documents.preview.notAvailable") }}</p>
								</div>
							</div>
						</div>
						<div class="space-y-4 px-5 py-4">
							<div class="grid grid-cols-2 gap-3 text-sm">
								<div>
									<p class="text-stone-400">{{ t("documents.meta.type") }}</p>
									<p class="font-medium text-[var(--app-text)]">{{ getFileTypeName(previewFile.type) }}</p>
								</div>
								<div>
									<p class="text-stone-400">{{ t("documents.meta.size") }}</p>
									<p class="font-medium text-[var(--app-text)]">{{ formatFileSize(previewFile.size) }}</p>
								</div>
								<div>
									<p class="text-stone-400">{{ t("documents.meta.uploaded") }}</p>
									<p class="font-medium text-[var(--app-text)]">{{ formatDate(previewFile.uploadedAt) }}</p>
								</div>
								<div>
									<p class="text-stone-400">{{ t("documents.meta.fileDate") }}</p>
									<p class="font-medium text-[var(--app-text)]">{{ previewFile.lastModified ? formatTimestamp(previewFile.lastModified) : "—" }}</p>
								</div>
							</div>
							<div class="rounded-[1.25rem] border border-[var(--app-border)] bg-white/75 p-4 dark:bg-[var(--app-surface)]/80">
								<div class="flex items-start justify-between gap-3">
									<div>
										<p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--app-primary)]">{{ t("documents.processing.title") }}</p>
										<p class="mt-1 text-sm text-[var(--app-muted)]">{{ translationStatusLabel }}</p>
									</div>
									<div v-if="documentProcessing" class="flex flex-wrap justify-end gap-2 text-[11px] text-stone-500">
										<span class="rounded-full bg-stone-100 px-2 py-1 dark:bg-stone-800">{{ documentProcessing.extractionSource }}</span>
										<span v-if="documentProcessing.ocrApplied" class="rounded-full bg-primary-50 px-2 py-1 text-primary dark:bg-primary-900/20">OCR</span>
									</div>
								</div>
								<div v-if="processingLoading" class="flex items-center gap-3 py-5 text-sm text-[var(--app-muted)]">
									<div class="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
									<span>{{ t("documents.processing.loading") }}</span>
								</div>
								<div v-else-if="processingError" class="py-3 text-sm text-red-600">
									{{ processingError }}
								</div>
								<div v-else-if="documentProcessing" class="space-y-3 pt-4">
									<p v-if="previewSummaryText" class="text-sm font-medium text-[var(--app-text)]">
										{{ previewSummaryText }}
									</p>
									<div class="max-h-72 overflow-auto rounded-2xl bg-stone-50 p-3 text-sm leading-6 text-[var(--app-text)] dark:bg-stone-900/60">
										<pre class="whitespace-pre-wrap font-sans">{{ previewBodyText || t("documents.processing.noText") }}</pre>
									</div>
								</div>
								<div v-else class="py-3 text-sm text-[var(--app-muted)]">
									{{ t("documents.processing.noContent") }}
								</div>
							</div>
							<div class="flex flex-wrap gap-2">
								<UButton color="neutral" variant="soft" icon="i-lucide-eye" @click="handleFileClick(previewFile)">
									{{ t("documents.actions.open") }}
								</UButton>
								<UButton color="neutral" variant="ghost" icon="i-lucide-download" @click="downloadFileToDisk(previewFile)">
									{{ t("documents.actions.download") }}
								</UButton>
								<UButton v-if="canDownloadTranslatedFile" color="primary" variant="ghost" icon="i-lucide-languages" @click="downloadTranslatedFile(previewFile)">
									{{ t("documents.actions.translatedFile") }}
								</UButton>
								<UButton color="neutral" variant="ghost" icon="i-lucide-link" @click="copyDeepLink({ folderId: previewFile.folderId, fileId: previewFile.id })">
									{{ t("documents.actions.link") }}
								</UButton>
							</div>
						</div>
					</div>
					<div
						v-else
						class="hidden rounded-[1.75rem] border border-dashed border-[var(--app-border)] px-5 py-6 text-sm text-[var(--app-muted)] xl:block">
						{{ t("documents.preview.selectHint") }}
					</div>
				</aside>
				</div>

				<UModal v-model:open="isRenameModalOpen" :title="t('documents.modals.renameTitle')">
					<template #body>
						<div class="p-6 space-y-4">
							<UFormField :label="t('documents.modals.renameLabel')">
								<UInput v-model="renameValue" :placeholder="t('documents.modals.renamePlaceholder')" class="w-full" @keyup.enter="renameFile" />
							</UFormField>
							<div class="flex justify-end gap-3">
								<UButton variant="ghost" color="neutral" @click="isRenameModalOpen = false">{{ t("documents.actions.cancel") }}</UButton>
								<UButton :loading="isSaving" @click="renameFile">{{ t("documents.actions.rename") }}</UButton>
							</div>
						</div>
					</template>
				</UModal>

				<UModal v-model:open="isMoveModalOpen" :title="t('documents.modals.moveTitle')">
					<template #body>
						<div class="p-6 space-y-4">
							<p class="text-sm text-stone-500">
								{{ t("documents.modals.moveDescription", { count: selectedFiles.length + selectedFolders.length }) }}
							</p>
							
							<div class="bg-stone-50 dark:bg-stone-800 rounded-xl p-3 space-y-2">
								<div class="flex items-center gap-2 text-sm flex-wrap">
									<button
										@click="navigateMoveBrowse(null)"
										class="text-stone-600 dark:text-stone-400 hover:text-primary transition-colors"
										:class="{ 'text-primary font-bold': !moveBrowseFolderId }"
									>
										{{ t("nav.documents") }}
									</button>
									<template v-for="(folder, index) in moveBrowseBreadcrumbs" :key="folder.id">
										<UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-stone-400" />
										<button
											@click="navigateMoveBrowse(folder.id)"
											class="text-stone-600 dark:text-stone-400 hover:text-primary transition-colors"
											:class="{ 'text-primary font-bold': index === moveBrowseBreadcrumbs.length - 1 }"
										>
											{{ folder.name }}
										</button>
									</template>
								</div>
								
								<div class="max-h-48 overflow-y-auto space-y-1">
									<button
										v-if="moveBrowseFolderId"
										@click="navigateMoveBrowseUp"
										class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-left"
									>
										<UIcon name="i-lucide-arrow-up" class="w-4 h-4 text-stone-400" />
										<span class="text-stone-500">..</span>
									</button>
									
									<button
										v-for="folder in moveBrowseSubfolders"
										:key="folder.id"
										@click="navigateMoveBrowse(folder.id)"
										class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-left group"
									>
										<UIcon name="i-lucide-folder" class="w-4 h-4 text-primary" />
										<span class="flex-1 truncate">{{ folder.name }}</span>
										<UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
									</button>
									
									<p v-if="moveBrowseSubfolders.length === 0 && !moveBrowseFolderId" class="text-sm text-stone-400 text-center py-4">
										{{ t("documents.modals.noSubfolders") }}
									</p>
									<p v-if="moveBrowseSubfolders.length === 0 && moveBrowseFolderId" class="text-sm text-stone-400 text-center py-4">
										{{ t("documents.modals.noMoreSubfolders") }}
									</p>
								</div>
							</div>
							
							<div class="flex items-center justify-between gap-3 pt-2">
								<UButton variant="ghost" color="neutral" @click="isMoveModalOpen = false">
									{{ t("documents.actions.cancel") }}
								</UButton>
								<UButton
									color="primary"
									:loading="isSaving"
									:disabled="moveBrowseFolderId === currentFolderId"
									@click="moveItems(moveBrowseFolderId)"
								>
									<UIcon name="i-lucide-folder-input" class="w-4 h-4 mr-1" />
									{{ moveBrowseFolderId ? t("documents.actions.moveHere") : t("documents.actions.moveToRoot") }}
								</UButton>
							</div>
						</div>
					</template>
				</UModal>
			</template>
		</div>

		<GalleryViewer 
			v-if="galleryOpen"
			:images="sortedImages"
			:initial-index="galleryIndex"
			@close="galleryOpen = false"
		/>

		<VideoPlayer
			v-if="videoOpen && currentVideo"
			:video="currentVideo"
			@close="videoOpen = false; currentVideo = null"
		/>
	</div>
</template>
