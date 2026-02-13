<script setup lang="ts">
import type { GlobalFile } from "~/types";

definePageMeta({ middleware: ["is-admin"] });

const { waitForAuth, token } = useAuthReady();
const toast = useToast();

const files = ref<GlobalFile[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const downloadingFileId = ref<string | null>(null);

const fetchData = async () => {
	try {
		await waitForAuth();
		loading.value = true;
		error.value = null;
		const data = await $fetch("/api/files/trash", {
			headers: { Authorization: `Bearer ${token.value}` },
		});
		files.value = data.files || [];
	} catch (e: any) {
		error.value = e.data?.message || e.message || "Fehler beim Laden";
	} finally {
		loading.value = false;
	}
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

const restoreFile = async (file: GlobalFile) => {
	if (!confirm(`"${file.name}" wiederherstellen?`)) return;

	try {
		await $fetch("/api/files/restore", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { fileId: file.id },
		});
		toast.add({ title: "Datei wiederhergestellt", color: "success" });
		fetchData();
	} catch (e: any) {
		toast.add({ title: "Fehler beim Wiederherstellen", description: e.message, color: "error" });
	}
};

const permanentDelete = async (file: GlobalFile) => {
	if (!confirm(`"${file.name}" ENDGÜLTIG löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return;

	try {
		await $fetch("/api/files/permanent-delete", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { fileId: file.id },
		});
		toast.add({ title: "Datei endgültig gelöscht", color: "success" });
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
					<h1 class="text-3xl font-black">Papierkorb</h1>
					<p class="text-stone-500 mt-1">Gelöschte Dateien können hier wiederhergestellt werden</p>
				</div>
				<UButton
					variant="soft"
					color="neutral"
					icon="i-lucide-arrow-left"
					@click="navigateTo('/admin')"
				>
					Zurück zum Admin
				</UButton>
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

			<div v-else-if="files.length === 0" class="text-center py-20">
				<div class="w-20 h-20 mx-auto rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-6">
					<UIcon name="i-lucide-trash-2" class="w-10 h-10 text-stone-400" />
				</div>
				<h2 class="text-xl font-bold text-stone-600 dark:text-stone-400 mb-2">Papierkorb ist leer</h2>
				<p class="text-stone-500">Keine gelöschten Dateien vorhanden</p>
			</div>

			<div v-else class="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
				<div class="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
					<p class="text-sm text-stone-500">{{ files.length }} Datei{{ files.length !== 1 ? 'en' : '' }} im Papierkorb</p>
				</div>

				<div class="divide-y divide-stone-100 dark:divide-stone-800">
					<div
						v-for="file in files"
						:key="file.id"
						class="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
					>
						<div class="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center shrink-0">
							<UIcon :name="getFileIcon(file.type)" class="w-6 h-6 text-stone-400" />
						</div>

						<div class="flex-1 min-w-0">
							<p class="font-medium text-stone-700 dark:text-stone-300 truncate">{{ file.name }}</p>
							<div class="flex items-center gap-3 text-xs text-stone-400">
								<span>{{ formatFileSize(file.size) }}</span>
								<span v-if="file.deletedAt">· Gelöscht: {{ new Date(file.deletedAt).toLocaleDateString('de-CH') }}</span>
							</div>
						</div>

						<div class="flex items-center gap-2">
							<UTooltip text="Herunterladen">
								<button
									class="p-2 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary transition-colors"
									:disabled="downloadingFileId === file.id"
									@click="downloadFile(file)"
								>
									<UIcon v-if="downloadingFileId === file.id" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
									<UIcon v-else name="i-lucide-download" class="w-4 h-4" />
								</button>
							</UTooltip>
							<UTooltip text="Wiederherstellen">
								<button
									class="p-2 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 transition-colors"
									@click="restoreFile(file)"
								>
									<UIcon name="i-lucide-undo-2" class="w-4 h-4" />
								</button>
							</UTooltip>
							<UTooltip text="Endgültig löschen">
								<button
									class="p-2 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
									@click="permanentDelete(file)"
								>
									<UIcon name="i-lucide-trash-2" class="w-4 h-4" />
								</button>
							</UTooltip>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
