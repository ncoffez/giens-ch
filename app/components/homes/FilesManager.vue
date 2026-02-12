<script setup lang="ts">
import type { HomeFile, HomeFolder } from "~/types";

const props = defineProps<{
	home: any;
}>();

const emit = defineEmits<{
	refresh: [];
}>();

const { $token } = useNuxtApp();
const toast = useToast();

const files = computed<HomeFile[]>(() => props.home?.files || []);
const folders = computed<HomeFolder[]>(() => props.home?.folders || []);

const currentFolderId = ref<string | null>(null);
const selectedFile = ref<HomeFile | null>(null);
const isUploading = ref(false);
const isCreatingFolder = ref(false);
const newFolderName = ref("");
const dragover = ref(false);

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
				emit("refresh");
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
		await $fetch(`/api/homes/${props.home.id}/folders.create`, {
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
		emit("refresh");
	} catch (e: any) {
		toast.add({ title: "Fehler beim Erstellen", description: e.message, color: "error" });
	}
};

const deleteFile = async (file: HomeFile) => {
	if (!confirm(`"${file.name}" wirklich löschen?`)) return;

	try {
		await $fetch(`/api/homes/${props.home.id}/files.delete`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: { fileId: file.id },
		});
		toast.add({ title: "Datei gelöscht", color: "success" });
		emit("refresh");
	} catch (e: any) {
		toast.add({ title: "Fehler beim Löschen", description: e.message, color: "error" });
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
			headers: { Authorization: `Bearer ${$token.value}` },
			body: { folderId: folder.id },
		});
		toast.add({ title: "Ordner gelöscht", color: "success" });
		emit("refresh");
	} catch (e: any) {
		toast.add({ title: "Fehler beim Löschen", description: e.message, color: "error" });
	}
};
</script>

<template>
	<div class="space-y-6">
		<div class="flex items-center justify-between gap-4 flex-wrap">
			<div class="flex items-center gap-2 text-sm">
				<button
					@click="navigateToFolder(null)"
					class="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
					:class="{ 'text-primary font-bold': !currentFolderId }"
				>
					<UIcon name="i-lucide-home" class="w-4 h-4" />
					<span>Home</span>
				</button>
				<template v-for="(folder, index) in breadcrumbs" :key="folder.id">
					<UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-gray-400" />
					<button
						@click="navigateToFolder(folder.id)"
						class="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
						:class="{ 'text-primary font-bold': index === breadcrumbs.length - 1 }"
					>
						<span>{{ folder.name }}</span>
					</button>
				</template>
			</div>

			<div class="flex items-center gap-2">
				<UButton
					variant="soft"
					color="neutral"
					size="sm"
					icon="i-lucide-folder-plus"
					@click="isCreatingFolder = true"
				>
					Neuer Ordner
				</UButton>
				<label class="cursor-pointer">
					<UButton
						as="span"
						color="primary"
						size="sm"
						icon="i-lucide-upload"
						:loading="isUploading"
					>
						Datei hochladen
					</UButton>
					<input type="file" multiple class="hidden" @change="handleFileSelect" />
				</label>
			</div>
		</div>

		<div
			v-if="isCreatingFolder"
			class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700"
		>
			<UIcon name="i-lucide-folder" class="w-6 h-6 text-primary" />
			<input
				v-model="newFolderName"
				type="text"
				placeholder="Ordnername..."
				class="flex-1 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
				@keyup.enter="createFolder"
				@keyup.escape="isCreatingFolder = false"
			/>
			<UButton size="sm" @click="createFolder">Erstellen</UButton>
			<UButton size="sm" variant="ghost" color="neutral" @click="isCreatingFolder = false">Abbrechen</UButton>
		</div>

		<div
			class="min-h-[200px] rounded-2xl border-2 border-dashed transition-colors"
			:class="dragover ? 'border-primary bg-primary-50 dark:bg-primary-900/10' : 'border-gray-200 dark:border-gray-700'"
			@dragover.prevent="dragover = true"
			@dragleave.prevent="dragover = false"
			@drop.prevent="handleFileDrop"
		>
			<div v-if="currentSubfolders.length === 0 && currentFiles.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
				<UIcon name="i-lucide-folder-open" class="w-12 h-12 mb-4" />
				<p class="font-medium">Keine Dateien</p>
				<p class="text-sm">Ziehen Sie Dateien hierher oder klicken Sie auf "Datei hochladen"</p>
			</div>

			<div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
				<button
					v-for="folder in currentSubfolders"
					:key="folder.id"
					class="group p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-primary-50 dark:hover:bg-primary-900/10 border border-gray-100 dark:border-gray-700 hover:border-primary transition-all text-center"
					@dblclick="navigateToFolder(folder.id)"
				>
					<div class="relative">
						<UIcon name="i-lucide-folder" class="w-12 h-12 mx-auto text-primary mb-2 group-hover:scale-110 transition-transform" />
						<button
							class="absolute top-0 right-0 p-1 rounded-full bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
							@click.stop="deleteFolder(folder)"
						>
							<UIcon name="i-lucide-trash-2" class="w-3 h-3" />
						</button>
					</div>
					<p class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{{ folder.name }}</p>
				</button>

				<div
					v-for="file in currentFiles"
					:key="file.id"
					class="group p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary transition-all"
				>
					<div class="relative">
						<a :href="file.url" target="_blank" class="block">
							<div v-if="file.type.startsWith('image/')" class="aspect-square rounded-xl overflow-hidden mb-2">
								<img :src="file.url" :alt="file.name" class="w-full h-full object-cover" />
							</div>
							<div v-else class="aspect-square rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2">
								<UIcon :name="getFileIcon(file.type)" class="w-12 h-12 text-gray-400" />
							</div>
						</a>
						<div class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
							<a
								:href="file.url"
								target="_blank"
								class="p-1.5 rounded-full bg-primary-100 text-primary hover:bg-primary-200 transition-colors"
							>
								<UIcon name="i-lucide-download" class="w-3 h-3" />
							</a>
							<button
								class="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
								@click="deleteFile(file)"
							>
								<UIcon name="i-lucide-trash-2" class="w-3 h-3" />
							</button>
						</div>
					</div>
					<p class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{{ file.name }}</p>
					<p class="text-xs text-gray-400">{{ formatFileSize(file.size) }}</p>
				</div>
			</div>
		</div>
	</div>
</template>