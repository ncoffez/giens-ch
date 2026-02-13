<script setup lang="ts">
import type { GlobalFile, GlobalFolder } from "~/types";

definePageMeta({ middleware: ["is-logged-in"] });

const { $token, $isAdmin } = useNuxtApp();
const toast = useToast();

const files = ref<GlobalFile[]>([]);
const folders = ref<GlobalFolder[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const currentFolderId = ref<string | null>(null);
const isUploading = ref(false);
const isCreatingFolder = ref(false);
const newFolderName = ref("");
const dragover = ref(false);
const downloadingFileId = ref<string | null>(null);

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

const navigateToFolder = (folderId: string | null) => {
	currentFolderId.value = folderId;
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
	return "i-lucide-file";
};

const fetchData = async () => {
	try {
		loading.value = true;
		error.value = null;
		const data = await $fetch("/api/files", {
			headers: { Authorization: `Bearer ${$token.value}` },
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
					headers: { Authorization: `Bearer ${$token.value}` },
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
			headers: { Authorization: `Bearer ${$token.value}` },
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

const downloadFile = async (file: GlobalFile) => {
	try {
		downloadingFileId.value = file.id;
		const response = await $fetch<{ url: string }>(`/api/files/download?fileId=${file.id}`, {
			headers: { Authorization: `Bearer ${$token.value}` },
		});
		window.open(response.url, "_blank");
	} catch (e: any) {
		toast.add({ title: "Fehler beim Download", description: e.message, color: "error" });
	} finally {
		downloadingFileId.value = null;
	}
};

const deleteFile = async (file: GlobalFile) => {
	if (!confirm(`"${file.name}" wirklich löschen?`)) return;

	try {
		await $fetch("/api/files/delete", {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: { fileId: file.id },
		});
		toast.add({ title: "Datei gelöscht", color: "success" });
		fetchData();
	} catch (e: any) {
		toast.add({ title: "Fehler beim Löschen", description: e.message, color: "error" });
	}
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
			headers: { Authorization: `Bearer ${$token.value}` },
			body: { folderId: folder.id },
		});
		toast.add({ title: "Ordner gelöscht", color: "success" });
		fetchData();
	} catch (e: any) {
		toast.add({ title: "Fehler beim Löschen", description: e.message, color: "error" });
	}
};

onMounted(fetchData);
</script>

<template>
	<div class="min-h-screen bg-stone-50 dark:bg-stone-900">
		<div class="max-w-screen-xl mx-auto px-4 py-8">
			<div class="flex items-center justify-between mb-8">
				<div>
					<h1 class="text-3xl font-black">Dokumente</h1>
					<p class="text-stone-500 mt-1">Sichtbar nur für Hauseigentümer und Administratoren</p>
				</div>
				<div v-if="$isAdmin" class="flex items-center gap-2">
					<UButton
						variant="soft"
						color="neutral"
						icon="i-lucide-folder-plus"
						@click="isCreatingFolder = true"
					>
						Neuer Ordner
					</UButton>
					<label class="cursor-pointer">
						<UButton
							as="span"
							color="primary"
							icon="i-lucide-upload"
							:loading="isUploading"
						>
							Datei hochladen
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
					<div class="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
						<div class="flex items-center gap-2 text-sm">
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

					<div
						v-if="isCreatingFolder"
						class="px-6 py-4 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-700"
					>
						<div class="flex items-center gap-3">
							<UIcon name="i-lucide-folder" class="w-6 h-6 text-primary" />
							<input
								v-model="newFolderName"
								type="text"
								placeholder="Ordnername..."
								class="flex-1 px-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
								@keyup.enter="createFolder"
								@keyup.escape="isCreatingFolder = false"
							/>
							<UButton size="sm" @click="createFolder">Erstellen</UButton>
							<UButton size="sm" variant="ghost" color="neutral" @click="isCreatingFolder = false">Abbrechen</UButton>
						</div>
					</div>

					<div
						class="min-h-[300px]"
						:class="{ 'border-2 border-dashed border-primary bg-primary-50 dark:bg-primary-900/10': dragover && $isAdmin }"
						@dragover.prevent="dragover = true"
						@dragleave.prevent="dragover = false"
						@drop.prevent="handleFileDrop"
					>
						<div v-if="currentSubfolders.length === 0 && currentFiles.length === 0" class="flex flex-col items-center justify-center py-20 text-stone-400">
							<UIcon name="i-lucide-folder-open" class="w-16 h-16 mb-4" />
							<p class="font-medium text-lg">Keine Dateien</p>
							<p v-if="$isAdmin" class="text-sm mt-2">Ziehen Sie Dateien hierher oder klicken Sie auf "Datei hochladen"</p>
						</div>

						<div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-6">
							<button
								v-for="folder in currentSubfolders"
								:key="folder.id"
								class="group p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 hover:bg-primary-50 dark:hover:bg-primary-900/10 border border-stone-100 dark:border-stone-700 hover:border-primary transition-all text-center"
								@dblclick="navigateToFolder(folder.id)"
							>
								<div class="relative">
									<UIcon name="i-lucide-folder" class="w-12 h-12 mx-auto text-primary mb-2 group-hover:scale-110 transition-transform" />
									<button
										v-if="$isAdmin"
										class="absolute -top-1 -right-1 p-1.5 rounded-full bg-red-500 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110"
										@click.stop="deleteFolder(folder)"
									>
										<UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
									</button>
								</div>
								<p class="text-sm font-medium text-stone-700 dark:text-stone-300 truncate">{{ folder.name }}</p>
							</button>

							<div
								v-for="file in currentFiles"
								:key="file.id"
								class="group p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 hover:border-primary hover:shadow-lg transition-all"
							>
								<div class="relative">
									<div v-if="file.type.startsWith('image/')" class="aspect-square rounded-xl overflow-hidden mb-3 bg-stone-100 dark:bg-stone-700">
										<img :src="file.url" :alt="file.name" class="w-full h-full object-cover" />
									</div>
									<div v-else class="aspect-square rounded-xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center mb-3">
										<UIcon :name="getFileIcon(file.type)" class="w-12 h-12 text-stone-400" />
									</div>
									
									<div class="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
										<UTooltip text="Herunterladen" :content="{ side: 'left' }">
											<button
												class="p-2 rounded-full bg-white/90 dark:bg-stone-900/90 text-primary shadow-md hover:bg-primary hover:text-white hover:scale-110 transition-all backdrop-blur-sm"
												:disabled="downloadingFileId === file.id"
												@click="downloadFile(file)"
											>
												<UIcon v-if="downloadingFileId === file.id" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
												<UIcon v-else name="i-lucide-download" class="w-4 h-4" />
											</button>
										</UTooltip>
										<UTooltip v-if="$isAdmin" text="Löschen" :content="{ side: 'left' }">
											<button
												class="p-2 rounded-full bg-white/90 dark:bg-stone-900/90 text-red-500 shadow-md hover:bg-red-500 hover:text-white hover:scale-110 transition-all backdrop-blur-sm"
												@click="deleteFile(file)"
											>
												<UIcon name="i-lucide-trash-2" class="w-4 h-4" />
											</button>
										</UTooltip>
									</div>
								</div>
								<p class="text-xs font-medium text-stone-700 dark:text-stone-300 truncate mb-1">{{ file.name }}</p>
								<p class="text-xs text-stone-400">{{ formatFileSize(file.size) }}</p>
							</div>
						</div>
					</div>
				</div>
			</template>
		</div>
	</div>
</template>
