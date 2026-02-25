<script setup lang="ts">
import type { HomeFile, HomeFolder, Home } from "../../types";

const props = defineProps<{
	home: Home;
}>();

const emit = defineEmits<{
	refresh: [];
}>();

const { token } = useAuthReady();
const toast = useToast();

const files = computed<HomeFile[]>(() => props.home?.files || []);
const folders = computed<HomeFolder[]>(() => props.home?.folders || []);

const currentFolderId = ref<string | null>(null);
const selectedFile = ref<HomeFile | null>(null);
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
	const crumbs: HomeFolder[] = [];
	if (!currentFolderId.value) return crumbs;

	let folder = folders.value.find(f => f.id === currentFolderId.value);
	while (folder) {
		crumbs.unshift(folder);
		folder = folders.value.find(f => f.id === folder?.parentId);
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

const navigateToFolder = (folderId: string | null) => {
	currentFolderId.value = folderId;
	selectedFile.value = null;
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

const handleFileDrop = (e: DragEvent) => {
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
				await $fetch(`/api/homes/${props.home.id}/files.upload`, {
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
				emit("refresh");
			};
			reader.readAsDataURL(file);
		} catch (e: unknown) {
			toast.add({ title: "Fehler beim Hochladen", description: getErrorMessage(e), color: "error" });
		} finally {
			isUploading.value = false;
		}
	}
};

const createFolder = async () => {
	if (!newFolderName.value.trim()) return;

	try {
		await $fetch(`/api/homes/${props.home.id}/folders.create`, {
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
		emit("refresh");
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Erstellen", description: getErrorMessage(e), color: "error" });
	}
};

const selectFile = (file: HomeFile) => {
	if (selectedFile.value?.id === file.id) {
		selectedFile.value = null;
	} else {
		selectedFile.value = file;
	}
};

const downloadFile = async (file: HomeFile) => {
	try {
		downloadingFileId.value = file.id;
		const response = await $fetch<{ url: string }>(`/api/homes/${props.home.id}/files.download?fileId=${file.id}`, {
			headers: { Authorization: `Bearer ${token.value}` },
		});
		window.open(response.url, "_blank");
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Download", description: getErrorMessage(e), color: "error" });
	} finally {
		downloadingFileId.value = null;
	}
};

const deleteFile = async (file: HomeFile) => {
	if (!confirm(`"${file.name}" wirklich löschen?`)) return;

	try {
		await $fetch(`/api/homes/${props.home.id}/files.delete`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { fileId: file.id },
		});
		toast.add({ title: "Datei gelöscht", color: "success" });
		selectedFile.value = null;
		emit("refresh");
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Löschen", description: getErrorMessage(e), color: "error" });
	}
};

const deleteFolder = async (folder: HomeFolder) => {
	const hasFiles = files.value.some(f => f.folderId === folder.id);
	const hasSubfolders = folders.value.some(f => f.parentId === folder.id);

	if (hasFiles || hasSubfolders) {
		toast.add({ title: "Ordner ist nicht leer", description: "Bitte löschen Sie zuerst alle Dateien und Unterordner.", color: "warning" });
		return;
	}

	if (!confirm(`"${folder.name}" wirklich löschen?`)) return;

	try {
		await $fetch(`/api/homes/${props.home.id}/folders.update`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { folderId: folder.id },
		});
		toast.add({ title: "Ordner gelöscht", color: "success" });
		emit("refresh");
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Löschen", description: getErrorMessage(e), color: "error" });
	}
};

const openRenameModal = () => {
	if (!selectedFile.value) return;
	renameValue.value = selectedFile.value.name;
	isRenameModalOpen.value = true;
};

const renameFile = async () => {
	if (!selectedFile.value || !renameValue.value.trim()) return;

	isSaving.value = true;
	try {
		await $fetch(`/api/homes/${props.home.id}/files.rename`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: {
				fileId: selectedFile.value.id,
				newName: renameValue.value.trim(),
			},
		});
		toast.add({ title: "Datei umbenannt", color: "success" });
		isRenameModalOpen.value = false;
		selectedFile.value = null;
		emit("refresh");
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Umbenennen", description: getErrorMessage(e), color: "error" });
	} finally {
		isSaving.value = false;
	}
};

const moveFile = async (targetFolderId: string | null) => {
	if (!selectedFile.value) return;

	isSaving.value = true;
	try {
		await $fetch(`/api/homes/${props.home.id}/files.move`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: {
				fileId: selectedFile.value.id,
				targetFolderId,
			},
		});
		toast.add({ title: "Datei verschoben", color: "success" });
		isMoveModalOpen.value = false;
		selectedFile.value = null;
		emit("refresh");
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Verschieben", description: getErrorMessage(e), color: "error" });
	} finally {
		isSaving.value = false;
	}
};
</script>

<template>
	<div class="space-y-4 md:space-y-6">
		<div class="flex items-center justify-between gap-3 flex-wrap">
			<div class="flex items-center gap-2 text-sm overflow-x-auto">
				<button
					@click="navigateToFolder(null)"
					class="flex items-center gap-1 text-stone-600 dark:text-stone-400 hover:text-primary transition-colors whitespace-nowrap"
					:class="{ 'text-primary font-bold': !currentFolderId }"
				>
					<UIcon name="i-lucide-home" class="w-4 h-4" />
					<span>Home</span>
				</button>
				<template v-for="(folder, index) in breadcrumbs" :key="folder.id">
					<UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-stone-400" />
					<button
						@click="navigateToFolder(folder.id)"
						class="flex items-center gap-1 text-stone-600 dark:text-stone-400 hover:text-primary transition-colors whitespace-nowrap"
						:class="{ 'text-primary font-bold': index === breadcrumbs.length - 1 }"
					>
						<span>{{ folder.name }}</span>
					</button>
				</template>
			</div>

			<div class="flex items-center gap-2 shrink-0">
				<UButton
					variant="soft"
					color="neutral"
					size="sm"
					icon="i-lucide-folder-plus"
					@click="isCreatingFolder = true"
				>
					<span class="hidden sm:inline">Neuer Ordner</span>
				</UButton>
				<label class="cursor-pointer">
					<UButton
						as="span"
						color="primary"
						size="sm"
						icon="i-lucide-upload"
						:loading="isUploading"
					>
						<span class="hidden sm:inline">Hochladen</span>
					</UButton>
					<input type="file" multiple class="hidden" @change="handleFileSelect" />
				</label>
			</div>
		</div>

		<div v-if="selectedFile" class="flex flex-wrap items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
			<UIcon name="i-lucide-file-check" class="w-5 h-5 text-primary shrink-0" />
			<span class="text-sm font-medium text-primary truncate max-w-[120px] md:max-w-none">{{ selectedFile.name }}</span>
			<div class="flex-1" />
			<div class="flex items-center gap-1">
				<UButton size="xs" variant="ghost" color="neutral" @click="downloadFile(selectedFile)" icon="i-lucide-download">
					<span class="hidden md:inline">Download</span>
				</UButton>
				<UButton size="xs" variant="ghost" color="neutral" @click="openRenameModal" icon="i-lucide-pencil">
					<span class="hidden md:inline">Umbenennen</span>
				</UButton>
				<UButton size="xs" variant="ghost" color="neutral" @click="isMoveModalOpen = true" icon="i-lucide-folder-input">
					<span class="hidden md:inline">Verschieben</span>
				</UButton>
				<UButton size="xs" variant="ghost" color="error" @click="deleteFile(selectedFile)" icon="i-lucide-trash-2">
					<span class="hidden md:inline">Löschen</span>
				</UButton>
				<UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-x" @click="selectedFile = null" />
			</div>
		</div>

		<div
			v-if="isCreatingFolder"
			class="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700"
		>
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

		<div
			class="min-h-[200px] rounded-2xl border-2 border-dashed transition-colors"
			:class="dragover ? 'border-primary bg-primary-50 dark:bg-primary-900/10' : 'border-stone-200 dark:border-stone-700'"
			@dragover.prevent="dragover = true"
			@dragleave.prevent="dragover = false"
			@drop.prevent="handleFileDrop"
		>
			<div v-if="currentSubfolders.length === 0 && currentFiles.length === 0" class="flex flex-col items-center justify-center py-12 md:py-16 text-stone-400">
				<UIcon name="i-lucide-folder-open" class="w-10 h-10 md:w-12 md:h-12 mb-4" />
				<p class="font-medium">Keine Dateien</p>
				<p class="text-xs md:text-sm mt-2 text-center px-4">Ziehen Sie Dateien hierher oder klicken Sie auf "Hochladen"</p>
			</div>

			<div v-else class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 p-3 md:p-4">
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
						<button
							class="absolute top-0 right-0 p-1 rounded-full bg-red-500 text-white shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110"
							@click.stop="deleteFolder(folder)"
						>
							<UIcon name="i-lucide-trash-2" class="w-3 h-3" />
						</button>
					</div>
					<p class="text-xs font-medium text-stone-700 dark:text-stone-300 truncate">{{ folder.name }}</p>
				</button>

				<button
					v-for="file in currentFiles"
					:key="file.id"
					class="p-3 rounded-2xl bg-white dark:bg-stone-800 border transition-all text-center"
					:class="selectedFile?.id === file.id ? 'border-primary ring-2 ring-primary/20' : 'border-stone-100 dark:border-stone-700 hover:border-primary'"
					@click="selectFile(file)"
					@dblclick="downloadFile(file)"
				>
					<div class="relative">
						<div v-if="file.type.startsWith('image/')" class="aspect-square rounded-xl overflow-hidden mb-2 bg-stone-100 dark:bg-stone-700">
							<img :src="file.url" :alt="file.name" class="w-full h-full object-cover" />
						</div>
						<div v-else class="aspect-square rounded-xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center mb-2">
							<UIcon :name="getFileIcon(file.type)" class="w-10 h-10" :class="getFileIconColor(file.type)" />
						</div>
					</div>
					<p class="text-xs font-medium text-stone-700 dark:text-stone-300 truncate">{{ file.name }}</p>
					<p class="text-[10px] text-stone-400">{{ formatFileSize(file.size) }}</p>
				</button>
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

		<UModal v-model:open="isMoveModalOpen" title="Datei verschieben">
			<template #body>
				<div class="p-6 space-y-4">
					<p class="text-sm text-stone-500">Wählen Sie einen Zielordner für <strong>{{ selectedFile?.name }}</strong></p>
					<div class="max-h-64 overflow-y-auto space-y-2">
						<button
							class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
							:class="currentFolderId === null ? 'border-primary bg-primary-50 dark:bg-primary-900/20' : 'border-stone-200 dark:border-stone-700 hover:border-primary'"
							@click="moveFile(null)"
						>
							<UIcon name="i-lucide-home" class="w-5 h-5 text-primary" />
							<span class="font-medium">Stammverzeichnis</span>
							<UIcon v-if="currentFolderId === null" name="i-lucide-check" class="w-4 h-4 ml-auto text-primary" />
						</button>
						<button
							v-for="folder in availableFoldersForMove"
							:key="folder.id"
							class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
							:class="currentFolderId === folder.id ? 'border-primary bg-primary-50 dark:bg-primary-900/20' : 'border-stone-200 dark:border-stone-700 hover:border-primary'"
							@click="moveFile(folder.id)"
						>
							<UIcon name="i-lucide-folder" class="w-5 h-5 text-primary" />
							<span class="font-medium">{{ folder.name }}</span>
							<UIcon v-if="currentFolderId === folder.id" name="i-lucide-check" class="w-4 h-4 ml-auto text-primary" />
						</button>
					</div>
					<div class="flex justify-end gap-3 pt-4">
						<UButton variant="ghost" color="neutral" @click="isMoveModalOpen = false">Abbrechen</UButton>
					</div>
				</div>
			</template>
		</UModal>
	</div>
</template>
