<script setup lang="ts">
import type { GlobalFile, GlobalFolder } from "~/types";
import GalleryViewer from "~/components/documents/GalleryViewer.vue";
import VideoPlayer from "~/components/documents/VideoPlayer.vue";

definePageMeta({ middleware: ["is-logged-in"] });

const { $isAdmin } = useNuxtApp();
const { waitForAuth, token } = useAuthReady();
const toast = useToast();
const route = useRoute();

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

const viewMode = ref<"grid" | "list">("list");
const sortBy = ref<"name" | "date" | "size">("name");
const sortOrder = ref<"asc" | "desc">("asc");

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

const currentFiles = computed(() => {
	return files.value.filter(f => f.folderId === currentFolderId.value);
});

const currentSubfolders = computed(() => {
	return folders.value.filter(f => f.parentId === currentFolderId.value);
});

const currentImages = computed(() => {
	return currentFiles.value.filter(f => f.type.startsWith("image/"));
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
	const sorted = [...currentFiles.value];
	sorted.sort((a, b) => {
		let comparison = 0;
		if (sortBy.value === "name") {
			comparison = a.name.localeCompare(b.name, "de");
		} else if (sortBy.value === "date") {
			const dateA = a.lastModified ? a.lastModified : new Date(a.uploadedAt).getTime();
			const dateB = b.lastModified ? b.lastModified : new Date(b.uploadedAt).getTime();
			comparison = dateA - dateB;
		} else if (sortBy.value === "size") {
			comparison = a.size - b.size;
		}
		return sortOrder.value === "asc" ? comparison : -comparison;
	});
	return sorted;
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

const hasSelection = computed(() => selectedFiles.value.length > 0 || selectedFolders.value.length > 0);

const totalItemsInFolder = computed(() => currentFiles.value.length + currentSubfolders.value.length);

const folderFileCount = (folderId: string) => 
	files.value.filter(f => f.folderId === folderId).length;

const folderImageCount = (folderId: string) => 
	files.value.filter(f => f.folderId === folderId && f.type.startsWith("image/")).length;

const navigateToFolder = (folderId: string | null) => {
	currentFolderId.value = folderId;
	selectedFiles.value = [];
	selectedFolders.value = [];
	cancelFolderCreation();
	
	const url = folderId 
		? `${route.path}?folder=${folderId}`
		: route.path;
	history.pushState({}, "", url);
};

const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return date.toLocaleDateString("de-CH", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
};

const formatTimestamp = (timestamp: number) => {
	const date = new Date(timestamp);
	return date.toLocaleDateString("de-CH", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
};

const getFileIcon = (type: string) => {
	if (type.startsWith("image/")) return "i-lucide-image";
	if (type === "application/pdf") return "i-lucide-file-text";
	if (type.includes("word") || type.includes("document")) return "i-lucide-file-text";
	if (type.includes("sheet") || type.includes("excel")) return "i-lucide-spreadsheet";
	if (type.includes("presentation") || type.includes("powerpoint")) return "i-lucide-presentation";
	if (type.includes("zip") || type.includes("rar") || type.includes("archive") || type.includes("compressed")) return "i-lucide-archive";
	if (type.startsWith("video/")) return "i-lucide-video";
	if (type.startsWith("audio/")) return "i-lucide-music";
	if (type.includes("json") || type.includes("javascript") || type.includes("typescript") || type.includes("html") || type.includes("css")) return "i-lucide-code";
	return "i-lucide-file";
};

const getFileIconColor = (type: string) => {
	if (type.startsWith("image/")) return "text-purple-500";
	if (type === "application/pdf") return "text-red-500";
	if (type.includes("word") || type.includes("document")) return "text-blue-500";
	if (type.includes("sheet") || type.includes("excel")) return "text-green-500";
	if (type.includes("presentation") || type.includes("powerpoint")) return "text-orange-500";
	if (type.includes("zip") || type.includes("rar") || type.includes("archive")) return "text-yellow-600";
	if (type.startsWith("video/")) return "text-pink-500";
	if (type.startsWith("audio/")) return "text-cyan-500";
	if (type.includes("json") || type.includes("javascript") || type.includes("typescript")) return "text-emerald-500";
	return "text-stone-400";
};

const getFileIconBg = (type: string) => {
	if (type.startsWith("image/")) return "bg-purple-100 dark:bg-purple-900/30";
	if (type === "application/pdf") return "bg-red-100 dark:bg-red-900/30";
	if (type.includes("word") || type.includes("document")) return "bg-blue-100 dark:bg-blue-900/30";
	if (type.includes("sheet") || type.includes("excel")) return "bg-green-100 dark:bg-green-900/30";
	if (type.includes("presentation") || type.includes("powerpoint")) return "bg-orange-100 dark:bg-orange-900/30";
	if (type.includes("zip") || type.includes("rar") || type.includes("archive")) return "bg-yellow-100 dark:bg-yellow-900/30";
	if (type.startsWith("video/")) return "bg-pink-100 dark:bg-pink-900/30";
	if (type.startsWith("audio/")) return "bg-cyan-100 dark:bg-cyan-900/30";
	if (type.includes("json") || type.includes("javascript") || type.includes("typescript")) return "bg-emerald-100 dark:bg-emerald-900/30";
	return "bg-stone-100 dark:bg-stone-800";
};

const fetchData = async () => {
	try {
		await waitForAuth();
		loading.value = true;
		error.value = null;
		const data = await $fetch("/api/files", {
			headers: { Authorization: `Bearer ${token.value}` },
		});
		files.value = data.files || [];
		folders.value = data.folders || [];
	} catch (e: unknown) {
		error.value = getFetchError(e) || "Fehler beim Laden";
	} finally {
		loading.value = false;
	}
};

const handleFileDrop = (e: DragEvent) => {
	if (!$isAdmin.value) return;
	dragover.value = false;
	const droppedFiles = e.dataTransfer?.files;
	if (droppedFiles) {
		uploadFiles(Array.from(droppedFiles));
	}
};

const handleFileSelect = (e: Event) => {
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
			} catch (e) {
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

	let errorCount = 0;

	for (const file of fileList) {
		uploadQueue.value.currentFile = file.name;
		
		try {
			await uploadSingleFile(file);
			uploadQueue.value.completed++;
		} catch (e) {
			errorCount++;
			console.error(`Failed to upload ${file.name}:`, e);
		}
	}

	uploadQueue.value.isUploading = false;
	uploadQueue.value.currentFile = null;

	await fetchData();

	const successCount = uploadQueue.value.completed;
	if (errorCount > 0) {
		toast.add({ 
			title: `${successCount}/${fileList.length} Dateien hochgeladen`, 
			description: `${errorCount} fehlgeschlagen`,
			color: "warning" 
		});
	} else {
		toast.add({ 
			title: `${successCount} Datei${successCount !== 1 ? 'en' : ''} hochgeladen`, 
			color: "success" 
		});
	}
};

const createFolderInline = () => {
	const tempId = `temp-${Date.now()}`;
	const newFolder: GlobalFolder = {
		id: tempId,
		name: "Neuer Ordner",
		parentId: currentFolderId.value,
		createdAt: new Date().toISOString(),
		createdBy: "",
	};
	
	tempFolders.value.push(newFolder);
	editingFolderId.value = tempId;
	editingFolderName.value = "Neuer Ordner";
	
	nextTick(() => {
		const input = document.querySelector('.folder-name-input') as HTMLInputElement;
		input?.focus();
		input?.select();
	});
};

const saveFolderName = async (tempId: string) => {
	if (!editingFolderName.value.trim()) {
		return;
	}
	
	try {
		await $fetch("/api/folders/create", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: {
				name: editingFolderName.value.trim(),
				parentId: currentFolderId.value,
			},
		});
		
		tempFolders.value = tempFolders.value.filter(f => f.id !== tempId);
		editingFolderId.value = null;
		
		await fetchData();
		toast.add({ title: "Ordner erstellt", color: "success" });
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Erstellen", description: getErrorMessage(e), color: "error" });
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
		tempFolders.value = tempFolders.value.filter(f => f.id !== folderId);
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
	const index = currentImages.value.findIndex(f => f.id === file.id);
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
	} else {
		downloadFile(file);
	}
};

const downloadFile = async (file: GlobalFile) => {
	try {
		downloadingFileId.value = file.id;
		const response = await $fetch<{ url: string }>(`/api/files/download?fileId=${file.id}`, {
			headers: { Authorization: `Bearer ${token.value}` },
		});
		window.open(response.url, "_blank");
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Download", description: getErrorMessage(e), color: "error" });
	} finally {
		downloadingFileId.value = null;
	}
};

const downloadSelectedFiles = async () => {
	for (const file of selectedFiles.value) {
		await downloadFile(file);
	}
};

const deleteFile = async (file: GlobalFile) => {
	if (!confirm(`"${file.name}" wirklich löschen?`)) return;

	try {
		await $fetch("/api/files/delete", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { fileId: file.id },
		});
		toast.add({ title: "Datei gelöscht", color: "success" });
		selectedFiles.value = selectedFiles.value.filter(f => f.id !== file.id);
		fetchData();
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Löschen", description: getErrorMessage(e), color: "error" });
	}
};

const deleteSelectedItems = async () => {
	const total = selectedFiles.value.length + selectedFolders.value.length;
	if (!confirm(`${total} Element(e) wirklich löschen?`)) return;

	let deletedCount = 0;

	for (const folder of [...selectedFolders.value]) {
		const hasFiles = files.value.some(f => f.folderId === folder.id);
		const hasSubfolders = folders.value.some(f => f.parentId === folder.id);

		if (hasFiles || hasSubfolders) {
			toast.add({ title: `"${folder.name}" ist nicht leer`, description: "Übersprungen.", color: "warning" });
			continue;
		}

		try {
			await $fetch("/api/folders/delete", {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: { folderId: folder.id },
			});
			deletedCount++;
		} catch (e: unknown) {
			toast.add({ title: `Fehler beim Löschen von ${folder.name}`, description: getFetchError(e), color: "error" });
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
			toast.add({ title: `Fehler beim Löschen von ${file.name}`, description: getFetchError(e), color: "error" });
		}
	}

	if (deletedCount > 0) {
		toast.add({ title: `${deletedCount} Element(e) gelöscht`, color: "success" });
	}
	selectedFiles.value = [];
	selectedFolders.value = [];
	fetchData();
};

const deleteFolder = async (folder: GlobalFolder) => {
	const hasFiles = files.value.some(f => f.folderId === folder.id);
	const hasSubfolders = folders.value.some(f => f.parentId === folder.id);

	if (hasFiles || hasSubfolders) {
		toast.add({ title: "Ordner ist nicht leer", description: "Bitte löschen Sie zuerst alle Dateien und Unterordner.", color: "warning" });
		return;
	}

	if (!confirm(`"${folder.name}" wirklich löschen?`)) return;

	try {
		await $fetch("/api/folders/delete", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { folderId: folder.id },
		});
		toast.add({ title: "Ordner gelöscht", color: "success" });
		selectedFolders.value = selectedFolders.value.filter(f => f.id !== folder.id);
		fetchData();
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Löschen", description: getErrorMessage(e), color: "error" });
	}
};

const getFolderMenuItems = (folder: GlobalFolder) => [
	[{
		label: "Verschieben",
		icon: "i-lucide-folder-input",
		onSelect: () => {
			selectedFolders.value = [folder];
			selectedFiles.value = [];
			isMoveModalOpen.value = true;
		},
	}],
	[{
		label: "Löschen",
		icon: "i-lucide-trash-2",
		onSelect: () => deleteFolder(folder),
	}],
];

const getFileMenuItems = (file: GlobalFile) => [
	[{
		label: file.type.startsWith("image/") ? "Anzeigen" : file.type === "video/mp4" ? "Abspielen" : "Download",
		icon: file.type.startsWith("image/") ? "i-lucide-eye" : file.type === "video/mp4" ? "i-lucide-play" : "i-lucide-download",
		onSelect: () => handleFileClick(file),
	}],
	[{
		label: "Download",
		icon: "i-lucide-download",
		onSelect: () => downloadFile(file),
	}, {
		label: "Umbenennen",
		icon: "i-lucide-pencil",
		onSelect: () => {
			selectedFiles.value = [file];
			selectedFolders.value = [];
			openRenameModal();
		},
	}, {
		label: "Verschieben",
		icon: "i-lucide-folder-input",
		onSelect: () => {
			selectedFiles.value = [file];
			selectedFolders.value = [];
			isMoveModalOpen.value = true;
		},
	}],
	[{
		label: "Löschen",
		icon: "i-lucide-trash-2",
		onSelect: () => deleteFile(file),
	}],
];

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
		toast.add({ title: "Datei umbenannt", color: "success" });
		isRenameModalOpen.value = false;
		selectedFiles.value = [];
		fetchData();
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Umbenennen", description: getErrorMessage(e), color: "error" });
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
			toast.add({ title: `Fehler beim Verschieben von ${file.name}`, description: getErrorMessage(e), color: "error" });
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
			toast.add({ title: `Fehler beim Verschieben von ${folder.name}`, description: getErrorMessage(e), color: "error" });
		}
	}
	
	if (successCount > 0) {
		const itemWord = successCount === 1 ? "Element" : "Elemente";
		toast.add({ title: `${successCount} ${itemWord} verschoben`, color: "success" });
	}
	isMoveModalOpen.value = false;
	selectedFiles.value = [];
	selectedFolders.value = [];
	fetchData();
	isSaving.value = false;
};

const toggleSort = (column: "name" | "date" | "size") => {
	if (sortBy.value === column) {
		sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
	} else {
		sortBy.value = column;
		sortOrder.value = "asc";
	}
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
	await fetchData();
});

watch(() => route.query.folder, (newFolderId) => {
	currentFolderId.value = (newFolderId as string) || null;
});
</script>

<template>
	<div class="min-h-screen bg-stone-50 dark:bg-stone-900 pb-20 lg:pb-0">
		<div class="max-w-screen-xl mx-auto px-4 py-6 md:py-8">
			<div class="flex items-center justify-between mb-6 md:mb-8 gap-4">
				<div>
					<h1 class="text-2xl md:text-3xl font-black">Dokumente</h1>
					<p class="text-stone-500 text-sm md:text-base mt-1 hidden sm:block">Sichtbar nur für Hauseigentümer und Administratoren</p>
				</div>
				<div v-if="$isAdmin" class="flex items-center gap-2 shrink-0">
					<UButton
						variant="soft"
						color="neutral"
						icon="i-lucide-folder-plus"
						@click="createFolderInline"
					>
						<span class="hidden sm:inline">Neuer Ordner</span>
					</UButton>
					<label class="cursor-pointer">
						<UButton
							as="span"
							color="primary"
							icon="i-lucide-upload"
							:loading="uploadQueue.isUploading"
						>
							<span class="hidden sm:inline">Hochladen</span>
						</UButton>
						<input type="file" multiple accept="image/*,video/mp4,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar" class="hidden" @change="handleFileSelect" />
					</label>
				</div>
			</div>

			<div v-if="uploadQueue.isUploading" class="mb-6 bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-4">
				<div class="flex items-center gap-4">
					<div class="flex-1">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm font-medium text-stone-700 dark:text-stone-300">
								Lade hoch: {{ uploadQueue.currentFile }}
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
					<p class="text-stone-500 font-medium">Laden...</p>
				</div>
			</div>

			<div v-else-if="error" class="text-center py-20">
				<div class="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
					<UIcon name="i-lucide-alert-circle" class="w-10 h-10 text-red-500" />
				</div>
				<h2 class="text-xl font-bold text-red-600 mb-4">{{ error }}</h2>
				<UButton color="neutral" variant="soft" @click="fetchData">Erneut versuchen</UButton>
			</div>

			<template v-else>
				<div class="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
					<div class="px-4 md:px-6 py-3 md:py-4 border-b border-stone-100 dark:border-stone-800 overflow-x-auto">
						<div class="flex items-center gap-2 text-sm whitespace-nowrap">
							<button
								@click="navigateToFolder(null)"
								class="flex items-center gap-1 text-stone-600 dark:text-stone-400 hover:text-primary transition-colors"
								:class="{ 'text-primary font-bold': !currentFolderId }"
							>
								<UIcon name="i-lucide-home" class="w-4 h-4" />
								<span>Start</span>
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

					<div class="px-4 md:px-6 py-2 md:py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-4">
						<div class="flex items-center gap-2">
							<UButtonGroup size="xs">
								<UButton
									:variant="viewMode === 'grid' ? 'solid' : 'ghost'"
									color="neutral"
									icon="i-lucide-grid-3x3"
									@click="viewMode = 'grid'"
								/>
								<UButton
									:variant="viewMode === 'list' ? 'solid' : 'ghost'"
									color="neutral"
									icon="i-lucide-list"
									@click="viewMode = 'list'"
								/>
							</UButtonGroup>
						</div>
						<div class="flex items-center gap-2 text-xs">
							<span class="text-stone-500 hidden sm:inline">Sortieren:</span>
							<UButtonGroup size="xs">
								<UButton
									:variant="sortBy === 'name' ? 'soft' : 'ghost'"
									color="neutral"
									@click="toggleSort('name')"
								>
									Name
									<UIcon v-if="sortBy === 'name'" :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="w-3 h-3 ml-1" />
								</UButton>
								<UButton
									:variant="sortBy === 'date' ? 'soft' : 'ghost'"
									color="neutral"
									@click="toggleSort('date')"
								>
									Datum
									<UIcon v-if="sortBy === 'date'" :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="w-3 h-3 ml-1" />
								</UButton>
								<UButton
									:variant="sortBy === 'size' ? 'soft' : 'ghost'"
									color="neutral"
									@click="toggleSort('size')"
								>
									Größe
									<UIcon v-if="sortBy === 'size'" :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="w-3 h-3 ml-1" />
								</UButton>
							</UButtonGroup>
						</div>
					</div>

					<div v-if="hasSelection && $isAdmin" class="flex flex-wrap items-center gap-2 px-4 md:px-6 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800">
						<UIcon name="i-lucide-files" class="w-5 h-5 text-primary shrink-0" />
						<span class="text-sm font-medium text-primary">
							{{ selectedFiles.length + selectedFolders.length }} von {{ totalItemsInFolder }} ausgewählt
						</span>
						<div class="flex-1" />
						<div class="flex items-center gap-1">
							<UButton v-if="selectedFiles.length > 0" size="xs" variant="ghost" color="neutral" @click="downloadSelectedFiles" icon="i-lucide-download">
								<span class="hidden md:inline">Download</span>
							</UButton>
							<UButton v-if="selectedFiles.length === 1 && selectedFolders.length === 0" size="xs" variant="ghost" color="neutral" @click="openRenameModal" icon="i-lucide-pencil">
								<span class="hidden md:inline">Umbenennen</span>
							</UButton>
							<UButton size="xs" variant="ghost" color="neutral" @click="isMoveModalOpen = true" icon="i-lucide-folder-input">
								<span class="hidden md:inline">Verschieben</span>
							</UButton>
							<UButton size="xs" variant="ghost" color="error" @click="deleteSelectedItems" icon="i-lucide-trash-2">
								<span class="hidden md:inline">Löschen</span>
							</UButton>
							<UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-x" @click="clearSelection" />
						</div>
					</div>

					<div
						class="min-h-[300px]"
						:class="{ 'border-2 border-dashed border-primary bg-primary-50 dark:bg-primary-900/10': dragover && $isAdmin }"
						@dragover.prevent="dragover = true"
						@dragleave.prevent="dragover = false"
						@drop.prevent="handleFileDrop"
					>
						<div v-if="sortedSubfolders.length === 0 && sortedFiles.length === 0" class="flex flex-col items-center justify-center py-16 md:py-20 text-stone-400">
							<UIcon name="i-lucide-folder-open" class="w-12 h-12 md:w-16 md:h-16 mb-4" />
							<p class="font-medium text-base md:text-lg">Keine Dateien</p>
							<p v-if="$isAdmin" class="text-xs md:text-sm mt-2 text-center px-4">Ziehen Sie Dateien hierher oder klicken Sie auf "Hochladen"</p>
						</div>

						<div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 p-3 md:p-6">
							<div
								v-for="folder in sortedSubfolders"
								:key="folder.id"
								class="group relative p-3 md:p-4 rounded-2xl bg-white dark:bg-stone-800 border transition-all text-center shadow-sm hover:shadow-md"
								:class="isFolderSelected(folder) ? 'border-primary ring-2 ring-primary/20' : 'border-stone-200 dark:border-stone-700 hover:border-primary'"
							>
								<button
									v-if="!editingFolderId || editingFolderId !== folder.id"
									class="absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors z-10"
									:class="isFolderSelected(folder) ? 'bg-primary border-primary' : 'border-stone-300 dark:border-stone-500 bg-white dark:bg-stone-800 hover:border-primary'"
									@click.stop="toggleFolderSelection(folder)"
								>
									<UIcon v-if="isFolderSelected(folder)" name="i-lucide-check" class="w-3 h-3 text-white" />
								</button>
								<UDropdownMenu v-if="$isAdmin && (!editingFolderId || editingFolderId !== folder.id)" :items="getFolderMenuItems(folder)" :ui="{ content: 'min-w-36' }">
									<button
										class="absolute top-2 right-2 w-6 h-6 rounded-full bg-white dark:bg-stone-800 shadow-md hover:bg-stone-100 dark:hover:bg-stone-700 transition-all z-10 flex items-center justify-center"
										@click.stop
									>
										<UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-stone-500" />
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
									<p class="text-xs md:text-sm font-medium text-stone-700 dark:text-stone-300 truncate">{{ folder.name }}</p>
									<p class="text-[10px] text-stone-400 mt-0.5">
										<template v-if="folderImageCount(folder.id) > 0">{{ folderImageCount(folder.id) }} Bilder</template>
										<template v-if="folderImageCount(folder.id) > 0 && folderFileCount(folder.id) > 0"> · </template>
										<template v-if="folderFileCount(folder.id) > 0">{{ folderFileCount(folder.id) }} Dateien</template>
									</p>
								</button>
							</div>

							<div
								v-for="file in sortedFiles"
								:key="file.id"
								class="group relative p-3 md:p-4 rounded-2xl bg-white dark:bg-stone-800 border transition-all text-center shadow-sm hover:shadow-md"
								:class="isFileSelected(file) ? 'border-primary ring-2 ring-primary/20' : 'border-stone-200 dark:border-stone-700 hover:border-primary'"
							>
								<button
									class="absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors z-10"
									:class="isFileSelected(file) ? 'bg-primary border-primary' : 'border-stone-300 dark:border-stone-500 bg-white dark:bg-stone-800 hover:border-primary'"
									@click.stop="toggleFileSelection(file)"
								>
									<UIcon v-if="isFileSelected(file)" name="i-lucide-check" class="w-3 h-3 text-white" />
								</button>
								<UDropdownMenu v-if="$isAdmin" :items="getFileMenuItems(file)" :ui="{ content: 'min-w-36' }">
									<button
										class="absolute top-2 right-2 w-6 h-6 rounded-full bg-white dark:bg-stone-800 shadow-md hover:bg-stone-100 dark:hover:bg-stone-700 transition-all z-10 flex items-center justify-center"
										@click.stop
									>
										<UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-stone-500" />
									</button>
								</UDropdownMenu>
								<button class="w-full" @click="handleFileClick(file)">
									<div v-if="file.type.startsWith('image/')" class="aspect-[4/3] rounded-xl overflow-hidden mb-2 md:mb-3 bg-stone-100 dark:bg-stone-700">
										<img :src="file.thumbnailUrl || file.url" :alt="file.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
									</div>
									<div v-else-if="file.type === 'video/mp4'" class="aspect-[4/3] rounded-xl flex items-center justify-center mb-2 md:mb-3 relative" :class="getFileIconBg(file.type)">
										<UIcon :name="getFileIcon(file.type)" class="w-8 h-8 md:w-12 md:h-12" :class="getFileIconColor(file.type)" />
										<div class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
											<div class="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
												<UIcon name="i-lucide-play" class="w-5 h-5 text-stone-800 ml-0.5" />
											</div>
										</div>
									</div>
									<div v-else class="aspect-[4/3] rounded-xl flex items-center justify-center mb-2 md:mb-3" :class="getFileIconBg(file.type)">
										<UIcon :name="getFileIcon(file.type)" class="w-8 h-8 md:w-12 md:h-12" :class="getFileIconColor(file.type)" />
									</div>
									<p class="text-xs md:text-sm font-medium text-stone-700 dark:text-stone-300 truncate">{{ file.name }}</p>
									<p class="text-[10px] md:text-xs text-stone-400 mt-0.5">{{ formatDate(file.uploadedAt) }}</p>
								</button>
							</div>
						</div>

						<div v-else class="p-3 md:p-6">
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead>
										<tr class="border-b border-stone-200 dark:border-stone-700 text-left">
											<th class="py-3 px-2 w-8"></th>
											<th class="py-3 px-2 font-medium text-stone-600 dark:text-stone-400">Name</th>
											<th class="py-3 px-2 font-medium text-stone-600 dark:text-stone-400 hidden md:table-cell">Typ</th>
											<th class="py-3 px-2 font-medium text-stone-600 dark:text-stone-400 hidden sm:table-cell">Größe</th>
											<th class="py-3 px-2 font-medium text-stone-600 dark:text-stone-400 hidden lg:table-cell">Dateidatum</th>
											<th class="py-3 px-2 font-medium text-stone-600 dark:text-stone-400 hidden md:table-cell">Hochgeladen</th>
											<th class="py-3 px-2 font-medium text-stone-600 dark:text-stone-400 hidden lg:table-cell">Von</th>
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
													class="w-4 h-4 rounded border flex items-center justify-center transition-colors"
													:class="isFolderSelected(folder) ? 'bg-primary border-primary' : 'border-stone-300 dark:border-stone-600 hover:border-primary'"
													@click.stop="toggleFolderSelection(folder)"
												>
													<UIcon v-if="isFolderSelected(folder)" name="i-lucide-check" class="w-3 h-3 text-white" />
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
													<span class="font-medium truncate">{{ folder.name }}</span>
												</button>
											</td>
											<td class="py-3 px-2 hidden md:table-cell text-stone-500">
												<template v-if="folderImageCount(folder.id) > 0">{{ folderImageCount(folder.id) }} Bilder</template>
												<template v-if="folderImageCount(folder.id) > 0 && folderFileCount(folder.id) > 0">, </template>
												<template v-if="folderFileCount(folder.id) > 0">{{ folderFileCount(folder.id) }} Dateien</template>
												<template v-if="folderImageCount(folder.id) === 0 && folderFileCount(folder.id) === 0">Ordner</template>
											</td>
											<td class="py-3 px-2 hidden sm:table-cell text-stone-500">—</td>
											<td class="py-3 px-2 hidden lg:table-cell text-stone-500">—</td>
											<td class="py-3 px-2 hidden md:table-cell text-stone-500">{{ formatDate(folder.createdAt) }}</td>
											<td class="py-3 px-2 hidden lg:table-cell text-stone-500 truncate">{{ folder.createdByName || "—" }}</td>
											<td class="py-3 px-2">
												<UDropdownMenu v-if="$isAdmin && (!editingFolderId || editingFolderId !== folder.id)" :items="getFolderMenuItems(folder)" :ui="{ content: 'min-w-36' }">
													<button class="w-6 h-6 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center" @click.stop>
														<UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-stone-500" />
													</button>
												</UDropdownMenu>
											</td>
										</tr>
										<tr
											v-for="file in sortedFiles"
											:key="file.id"
											class="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
											:class="{ 'bg-primary-50 dark:bg-primary-900/20': isFileSelected(file) }"
										>
											<td class="py-3 px-2">
												<button 
													class="w-4 h-4 rounded border flex items-center justify-center transition-colors"
													:class="isFileSelected(file) ? 'bg-primary border-primary' : 'border-stone-300 dark:border-stone-600 hover:border-primary'"
													@click.stop="toggleFileSelection(file)"
												>
													<UIcon v-if="isFileSelected(file)" name="i-lucide-check" class="w-3 h-3 text-white" />
												</button>
											</td>
											<td class="py-3 px-2">
												<button class="flex items-center gap-2 text-left w-full hover:text-primary transition-colors" @click="handleFileClick(file)">
													<div v-if="file.type.startsWith('image/')" class="w-8 h-8 rounded overflow-hidden bg-stone-100 dark:bg-stone-700 shrink-0">
														<img :src="file.thumbnailUrl || file.url" :alt="file.name" class="w-full h-full object-cover" />
													</div>
													<div v-else-if="file.type === 'video/mp4'" class="w-8 h-8 rounded flex items-center justify-center shrink-0 relative" :class="getFileIconBg(file.type)">
														<UIcon :name="getFileIcon(file.type)" class="w-4 h-4" :class="getFileIconColor(file.type)" />
													</div>
													<div v-else class="w-8 h-8 rounded flex items-center justify-center shrink-0" :class="getFileIconBg(file.type)">
														<UIcon :name="getFileIcon(file.type)" class="w-4 h-4" :class="getFileIconColor(file.type)" />
													</div>
													<span class="font-medium truncate">{{ file.name }}</span>
												</button>
											</td>
											<td class="py-3 px-2 hidden md:table-cell text-stone-500 truncate">{{ file.type || "Unbekannt" }}</td>
											<td class="py-3 px-2 hidden sm:table-cell text-stone-500">{{ formatFileSize(file.size) }}</td>
											<td class="py-3 px-2 hidden lg:table-cell text-stone-500">{{ file.lastModified ? formatTimestamp(file.lastModified) : "—" }}</td>
											<td class="py-3 px-2 hidden md:table-cell text-stone-500">{{ formatDate(file.uploadedAt) }}</td>
											<td class="py-3 px-2 hidden lg:table-cell text-stone-500 truncate">{{ file.uploadedByName || "—" }}</td>
											<td class="py-3 px-2">
												<UDropdownMenu v-if="$isAdmin" :items="getFileMenuItems(file)" :ui="{ content: 'min-w-36' }">
													<button class="w-6 h-6 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center" @click.stop>
														<UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-stone-500" />
													</button>
												</UDropdownMenu>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>

				<UModal v-model:open="isRenameModalOpen" title="Datei umbenennen">
					<template #body>
						<div class="p-6 space-y-4">
							<UFormField label="Neuer Dateiname">
								<UInput v-model="renameValue" placeholder="Dateiname..." class="w-full" @keyup.enter="renameFile" />
							</UFormField>
							<div class="flex justify-end gap-3">
								<UButton variant="ghost" color="neutral" @click="isRenameModalOpen = false">Abbrechen</UButton>
								<UButton :loading="isSaving" @click="renameFile">Umbenennen</UButton>
							</div>
						</div>
					</template>
				</UModal>

				<UModal v-model:open="isMoveModalOpen" title="Elemente verschieben">
					<template #body>
						<div class="p-6 space-y-4">
							<p class="text-sm text-stone-500">
								Wählen Sie einen Zielordner für <strong>{{ selectedFiles.length + selectedFolders.length }} Element(e)</strong>
							</p>
							<div class="max-h-64 overflow-y-auto space-y-2">
								<button
									class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
									:class="currentFolderId === null ? 'border-primary bg-primary-50 dark:bg-primary-900/20' : 'border-stone-200 dark:border-stone-700 hover:border-primary'"
									@click="moveItems(null)"
									:disabled="isSaving"
								>
									<UIcon name="i-lucide-home" class="w-5 h-5 text-primary" />
									<span class="font-medium">Stammverzeichnis</span>
								</button>
								<button
									v-for="folder in availableFoldersForMove"
									:key="folder.id"
									class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
									:class="'border-stone-200 dark:border-stone-700 hover:border-primary'"
									@click="moveItems(folder.id)"
									:disabled="isSaving"
								>
									<UIcon name="i-lucide-folder" class="w-5 h-5 text-primary" />
									<span class="font-medium">{{ folder.name }}</span>
								</button>
							</div>
							<div class="flex justify-end gap-3 pt-4">
								<UButton variant="ghost" color="neutral" @click="isMoveModalOpen = false">Abbrechen</UButton>
							</div>
						</div>
					</template>
				</UModal>
			</template>
		</div>

		<GalleryViewer 
			v-if="galleryOpen"
			:images="currentImages"
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
