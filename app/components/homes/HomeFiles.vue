<script setup lang="ts">
import type { Home, HomeFile } from "~/types";
import { getFileIcon, getFileIconColor } from "~/utils/fileTypes";

const props = defineProps<{
	home: Home;
	privacy?: "shared" | "private";
}>();

const emit = defineEmits<{
	refresh: [];
}>();

const { token } = useAuthReady();
const toast = useToast();
const isPrivate = computed(() => props.privacy === "private");
const visibleFiles = computed(() => isPrivate.value ? (props.home.privateFiles || []) : (props.home.files || []));

const uploading = ref(false);
const uploadProgress = ref(0);
const uploadTotal = ref(0);
const uploadCurrent = ref(0);

const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const uploadFiles = async (event: Event) => {
	const target = event.target as HTMLInputElement;
	const files = target.files;
	if (!files || files.length === 0) return;

	const fileArray = Array.from(files);

	const oversizedFiles = fileArray.filter(f => f.size > 50 * 1024 * 1024);
	if (oversizedFiles.length > 0) {
		toast.add({ title: "Datei zu gross (max. 50MB)", color: "error" });
		return;
	}

	uploading.value = true;
	uploadTotal.value = fileArray.length;
	uploadCurrent.value = 0;
	uploadProgress.value = 0;

	let successCount = 0;
	let errorCount = 0;

	for (let i = 0; i < fileArray.length; i++) {
		const file = fileArray[i];
		uploadCurrent.value = i + 1;
		uploadProgress.value = Math.round(((i + 1) / fileArray.length) * 100);

		try {
			const base64 = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = (e) => resolve(e.target?.result as string);
				reader.onerror = reject;
				reader.readAsDataURL(file);
			});

			await $fetch(`/api/homes/${props.home.id}/files/upload`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: {
					file: base64,
					name: file.name,
					type: file.type,
					size: file.size,
					lastModified: file.lastModified,
					private: isPrivate.value,
				},
			});
			successCount++;
		} catch (e: unknown) {
			errorCount++;
			console.error(`Failed to upload ${file.name}:`, e);
		}
	}

	uploading.value = false;
	target.value = "";

	if (successCount > 0) {
		toast.add({
			title: `${successCount} Datei${successCount > 1 ? "en" : ""} hochgeladen`,
			color: "success",
		});
		emit("refresh");
	}

	if (errorCount > 0) {
		toast.add({
			title: `${errorCount} Upload${errorCount > 1 ? "s" : ""} fehlgeschlagen`,
			color: "error",
		});
	}
};

const deleteFile = async (file: HomeFile) => {
	if (!confirm(`"${file.name}" wirklich löschen?`)) return;

	try {
		await $fetch(`/api/homes/${props.home.id}/files/delete`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { fileId: file.id, private: isPrivate.value },
		});
		toast.add({ title: "Datei gelöscht", color: "success" });
		emit("refresh");
	} catch (e: unknown) {
		toast.add({ title: "Löschen fehlgeschlagen", description: getFetchError(e), color: "error" });
	}
};

const downloadFile = async (file: HomeFile) => {
	const response = await $fetch<{ url: string }>(`/api/homes/${props.home.id}/files/download`, {
		headers: { Authorization: `Bearer ${token.value}` },
		query: { fileId: file.id, private: isPrivate.value ? "true" : "false" },
	});

	window.open(response.url, "_blank", "noopener,noreferrer");
};
</script>

<template>
	<div class="space-y-6">
		<!-- Upload area -->
		<label class="block cursor-pointer">
			<div
				class="border-2 border-dashed rounded-2xl p-8 text-center transition-all"
				:class="uploading
					? 'border-primary bg-primary-50 dark:bg-primary-900/20'
					: 'border-stone-200 dark:border-stone-700 hover:border-primary'"
			>
				<div v-if="uploading" class="space-y-3">
					<div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
					<p class="text-stone-600 dark:text-stone-400">
						Hochladen... {{ uploadCurrent }}/{{ uploadTotal }}
					</p>
					<div class="w-full max-w-xs mx-auto">
						<UProgress :value="uploadProgress" color="primary" size="sm" />
					</div>
				</div>
				<div v-else class="space-y-3">
					<UIcon name="i-lucide-upload-cloud" class="w-10 h-10 mx-auto text-stone-400" />
					<p class="text-stone-600 dark:text-stone-400 font-medium">Klicken zum Hochladen</p>
					<p class="text-sm text-stone-400">PDF, DOC, XLS und mehr (max. 50MB)</p>
					<p class="text-xs text-stone-400">
						{{ isPrivate ? "Nur für Eigentümer und Administratoren sichtbar" : "Mehrere Dateien möglich" }}
					</p>
				</div>
			</div>
			<input type="file" multiple class="hidden" :disabled="uploading" @change="uploadFiles" />
		</label>

		<!-- File list -->
		<div v-if="visibleFiles.length" class="space-y-3">
			<div
				v-for="file in visibleFiles"
				:key="file.id"
				class="flex items-center gap-4 p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 group"
			>
				<div class="p-2 bg-stone-50 dark:bg-stone-700 rounded-lg">
					<UIcon :name="getFileIcon(file.type)" class="w-6 h-6" :class="getFileIconColor(file.type)" />
				</div>
				<div class="flex-1 min-w-0">
					<p class="font-medium truncate">{{ file.name }}</p>
					<p class="text-sm text-stone-500">{{ formatFileSize(file.size) }}</p>
				</div>
				<div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
					<UButton variant="ghost" color="neutral" icon="i-lucide-download" size="sm" @click="downloadFile(file)" />
					<UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" @click="deleteFile(file)" />
				</div>
			</div>
		</div>

		<!-- Empty state -->
		<div v-else class="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-dashed border-stone-200 dark:border-stone-700">
			<UIcon name="i-lucide-folder" class="w-10 h-10 mx-auto text-stone-300 mb-3" />
			<p class="text-stone-500">Keine Dateien</p>
			<p class="text-sm text-stone-400">
				{{ isPrivate ? "Laden Sie interne Dokumente nur für Eigentümer hoch" : "Laden Sie Dokumente hoch, die Mieter herunterladen können" }}
			</p>
		</div>
	</div>
</template>
