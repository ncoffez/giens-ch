<script setup lang="ts">
import type { GlobalFile, GlobalFolder } from "~/types";

definePageMeta({ middleware: ["is-logged-in"] });

const { $isAdmin } = useNuxtApp();
const { waitForAuth, token } = useAuthReady();
const toast = useToast();

const files = ref<GlobalFile[]>([]);
const folders = ref<GlobalFolder[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const currentFolderId = ref<string | null>(null);
const selectedFiles = ref<GlobalFile[]>([]);
const isUploading = ref(false);
const isCreatingFolder = ref(false);
const newFolderName = ref("");
const dragover = ref(false);
const downloadingFileId = ref<string | null>(null);
const isRenameModalOpen = ref(false);
const isMoveModalOpen = ref(false);
const renameValue = ref("");
const isSaving = ref(false);

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

const availableFoldersForMove = computed(() => {
	return folders.value.filter(f => f.id !== currentFolderId.value);
});

const isMultiSelect = computed(() => selectedFiles.value.length > 1);

const navigateToFolder = (folderId: string | null) => {
	currentFolderId.value = folderId;
	selectedFiles.value = [];
};

const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
	} catch (e: any) {
		error.value = e.data?.message || e.message || "Fehler beim Laden";
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
};

const uploadFiles = async (fileList: File[]) => {
	for (const file of fileList) {
		try {
			isUploading.value = true;
			const reader = new FileReader();
			reader.onload = async () => {
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
					},
				});
				toast.add({ title: `${file.name} hochgeladen`, color: "success" });
				fetchData();
			};
			reader.readAsDataURL(file);
		} catch (e: any) {
			toast.add({ title: "Fehler beim Hochladen", description: e.message, color: "error" });
		} finally {
			isUploading.value = false;
		}
	}
};

const createFolder = async () => {
	if (!newFolderName.value.trim()) return;

	try {
		await $fetch("/api/folders/create", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: {
				name: newFolderName.value.trim(),
				parentId: currentFolderId.value,
			},
		});
		toast.add({ title: "Ordner erstellt", color: "success" });
		newFolderName.value = "";
		isCreatingFolder.value = false;
		fetchData();
	} catch (e: any) {
		toast.add({ title: "Fehler beim Erstellen", description: e.message, color: "error" });
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

const isFileSelected = (file: GlobalFile) => {
	return selectedFiles.value.some(f => f.id === file.id);
};

const downloadFile = async (file: GlobalFile) => {
	try {
		downloadingFileId.value = file.id;
		const response = await $fetch<{ url: string }>(`/api/files/download?fileId=${file.id}`, {
			headers: { Authorization: `Bearer ${token.value}` },
		});
		window.open(response.url, "_blank");
	} catch (e: any) {
		toast.add({ title: "Fehler beim Download", description: e.message, color: "error" });
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
	} catch (e: any) {
		toast.add({ title: "Fehler beim Löschen", description: e.message, color: "error" });
	}
};

const deleteSelectedFiles = async () => {
	if (!confirm(`${selectedFiles.value.length} Dateien wirklich löschen?`)) return;

	for (const file of [...selectedFiles.value]) {
		try {
			await $fetch("/api/files/delete", {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: { fileId: file.id },
			});
		} catch (e: any) {
			toast.add({ title: `Fehler beim Löschen von ${file.name}`, description: e.message, color: "error" });
		}
	}
	toast.add({ title: `${selectedFiles.value.length} Dateien gelöscht`, color: "success" });
	selectedFiles.value = [];
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
		fetchData();
	} catch (e: any) {
		toast.add({ title: "Fehler beim Löschen", description: e.message, color: "error" });
	}
};

const getFolderMenuItems = (folder: GlobalFolder) => [
	[{
		label: "Löschen",
		onSelect: () => deleteFolder(folder),
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
	} catch (e: any) {
		toast.add({ title: "Fehler beim Umbenennen", description: e.message, color: "error" });
	} finally {
		isSaving.value = false;
	}
};

const moveFiles = async (targetFolderId: string | null) => {
	if (selectedFiles.value.length === 0) return;

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
		} catch (e: any) {
			toast.add({ title: `Fehler beim Verschieben von ${file.name}`, description: e.message, color: "error" });
		}
	}
	
	if (successCount > 0) {
		toast.add({ title: `${successCount} Datei(en) verschoben`, color: "success" });
	}
	isMoveModalOpen.value = false;
	selectedFiles.value = [];
	fetchData();
	isSaving.value = false;
};

onMounted(fetchData);
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
						@click="isCreatingFolder = true"
					>
						<span class="hidden sm:inline">Neuer Ordner</span>
					</UButton>
					<label class="cursor-pointer">
						<UButton
							as="span"
							color="primary"
							icon="i-lucide-upload"
							:loading="isUploading"
						>
							<span class="hidden sm:inline">Hochladen</span>
						</UButton>
						<input type="file" multiple class="hidden" @change="handleFileSelect" />
					</label>
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

					<div v-if="selectedFiles.length > 0 && $isAdmin" class="flex flex-wrap items-center gap-2 px-4 md:px-6 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800">
						<UIcon name="i-lucide-files" class="w-5 h-5 text-primary shrink-0" />
						<span class="text-sm font-medium text-primary">{{ selectedFiles.length }} ausgewählt</span>
						<div class="flex-1" />
						<div class="flex items-center gap-1">
							<UButton size="xs" variant="ghost" color="neutral" @click="downloadSelectedFiles" icon="i-lucide-download">
								<span class="hidden md:inline">Download</span>
							</UButton>
							<UButton v-if="selectedFiles.length === 1" size="xs" variant="ghost" color="neutral" @click="openRenameModal" icon="i-lucide-pencil">
								<span class="hidden md:inline">Umbenennen</span>
							</UButton>
							<UButton size="xs" variant="ghost" color="neutral" @click="isMoveModalOpen = true" icon="i-lucide-folder-input">
								<span class="hidden md:inline">Verschieben</span>
							</UButton>
							<UButton size="xs" variant="ghost" color="error" @click="deleteSelectedFiles" icon="i-lucide-trash-2">
								<span class="hidden md:inline">Löschen</span>
							</UButton>
							<UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-x" @click="selectedFiles = []" />
						</div>
					</div>

					<div
						v-if="isCreatingFolder"
						class="px-4 md:px-6 py-3 md:py-4 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-700"
					>
						<div class="flex items-center gap-2 md:gap-3">
							<UIcon name="i-lucide-folder" class="w-5 h-5 md:w-6 md:h-6 text-primary shrink-0" />
							<input
								v-model="newFolderName"
								type="text"
								placeholder="Ordnername..."
								class="flex-1 px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
								@keyup.enter="createFolder"
								@keyup.escape="isCreatingFolder = false"
							/>
							<UButton size="sm" @click="createFolder">OK</UButton>
							<UButton size="sm" variant="ghost" color="neutral" @click="isCreatingFolder = false">
								<UIcon name="i-lucide-x" class="w-4 h-4" />
							</UButton>
						</div>
					</div>

					<div
						class="min-h-[300px]"
						:class="{ 'border-2 border-dashed border-primary bg-primary-50 dark:bg-primary-900/10': dragover && $isAdmin }"
						@dragover.prevent="dragover = true"
						@dragleave.prevent="dragover = false"
						@drop.prevent="handleFileDrop"
					>
						<div v-if="currentSubfolders.length === 0 && currentFiles.length === 0" class="flex flex-col items-center justify-center py-16 md:py-20 text-stone-400">
							<UIcon name="i-lucide-folder-open" class="w-12 h-12 md:w-16 md:h-16 mb-4" />
							<p class="font-medium text-base md:text-lg">Keine Dateien</p>
							<p v-if="$isAdmin" class="text-xs md:text-sm mt-2 text-center px-4">Ziehen Sie Dateien hierher oder klicken Sie auf "Hochladen"</p>
						</div>

						<div v-else class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 p-3 md:p-6">
							<button
								v-for="folder in currentSubfolders"
								:key="folder.id"
								class="group p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 hover:bg-primary-50 dark:hover:bg-primary-900/10 border border-stone-100 dark:border-stone-700 hover:border-primary transition-all text-center"
								@click="navigateToFolder(folder.id)"
							>
								<div class="relative">
									<div class="aspect-square rounded-xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center mb-2">
										<UIcon name="i-lucide-folder" class="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
									</div>
									<UDropdownMenu v-if="$isAdmin" :items="getFolderMenuItems(folder)" :ui="{ content: 'min-w-32' }">
										<button
											class="absolute top-0 right-0 p-1 rounded-full bg-white dark:bg-stone-800 shadow-md hover:bg-stone-100 dark:hover:bg-stone-700 transition-all"
											@click.stop
										>
											<UIcon name="i-lucide-more-horizontal" class="w-3.5 h-3.5 text-stone-500" />
										</button>
									</UDropdownMenu>
								</div>
								<p class="text-xs font-medium text-stone-700 dark:text-stone-300 truncate">{{ folder.name }}</p>
							</button>

							<button
								v-for="file in currentFiles"
								:key="file.id"
								class="p-3 rounded-2xl bg-white dark:bg-stone-800 border transition-all text-center"
								:class="isFileSelected(file) ? 'border-primary ring-2 ring-primary/20' : 'border-stone-100 dark:border-stone-700 hover:border-primary'"
								@click="toggleFileSelection(file)"
								@dblclick="downloadFile(file)"
							>
								<div class="relative">
									<div v-if="file.type.startsWith('image/')" class="aspect-square rounded-xl overflow-hidden mb-2 bg-stone-100 dark:bg-stone-700">
										<img :src="file.url" :alt="file.name" class="w-full h-full object-cover" />
									</div>
									<div v-else class="aspect-square rounded-xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center mb-2">
										<UIcon :name="getFileIcon(file.type)" class="w-10 h-10" :class="getFileIconColor(file.type)" />
									</div>
									<div v-if="isFileSelected(file)" class="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
										<UIcon name="i-lucide-check" class="w-3 h-3" />
									</div>
								</div>
								<p class="text-xs font-medium text-stone-700 dark:text-stone-300 truncate">{{ file.name }}</p>
								<p class="text-[10px] text-stone-400">{{ formatFileSize(file.size) }}</p>
							</button>
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

				<UModal v-model:open="isMoveModalOpen" title="Dateien verschieben">
					<template #body>
						<div class="p-6 space-y-4">
							<p class="text-sm text-stone-500">
								Wählen Sie einen Zielordner für <strong>{{ selectedFiles.length }} Datei(en)</strong>
							</p>
							<div class="max-h-64 overflow-y-auto space-y-2">
								<button
									class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
									:class="currentFolderId === null ? 'border-primary bg-primary-50 dark:bg-primary-900/20' : 'border-stone-200 dark:border-stone-700 hover:border-primary'"
									@click="moveFiles(null)"
								>
									<UIcon name="i-lucide-home" class="w-5 h-5 text-primary" />
									<span class="font-medium">Stammverzeichnis</span>
								</button>
								<button
									v-for="folder in availableFoldersForMove"
									:key="folder.id"
									class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
									:class="'border-stone-200 dark:border-stone-700 hover:border-primary'"
									@click="moveFiles(folder.id)"
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
	</div>
</template>
