<script setup lang="ts">
import type { Home, HomeFile } from "~/types";
import { canPreviewFile, getFileIcon, getFileIconColor, truncateFileName } from "~/utils/fileTypes";
import { openAfterAsyncNavigation } from "~/utils/openSignedFile";
import FilePreviewModal from "~/components/documents/FilePreviewModal.vue";

const props = defineProps<{
	home: Home;
	privacy?: "shared" | "private";
}>();

const emit = defineEmits<{
	refresh: [];
}>();

const { getFreshToken } = useAuthReady();
const toast = useToast();
const { t } = useI18n();
const isPrivate = computed(() => props.privacy === "private");
const visibleFiles = computed(() => isPrivate.value ? (props.home.privateFiles || []) : (props.home.files || []));
const targetPrivacy = computed<"shared" | "private">(() => isPrivate.value ? "shared" : "private");
const dragOverZone = ref(false);
const movingFileId = ref<string | null>(null);

const uploading = ref(false);
const uploadProgress = ref(0);
const uploadTotal = ref(0);
const uploadCurrent = ref(0);

const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getMoveActionLabel = (nextVisibility: "shared" | "private") => {
	return nextVisibility === "private"
		? t("homes.files.actions.moveToPrivate")
		: t("homes.files.actions.moveToShared");
};

const uploadFileList = async (fileArray: File[]) => {
	const oversizedFiles = fileArray.filter(f => f.size > 50 * 1024 * 1024);
	if (oversizedFiles.length > 0) {
		toast.add({ title: t("homes.files.toasts.maxSize"), color: "error" });
		return;
	}

	uploading.value = true;
	uploadTotal.value = fileArray.length;
	uploadCurrent.value = 0;
	uploadProgress.value = 0;
	const authToken = await getFreshToken();

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
				headers: { Authorization: `Bearer ${authToken}` },
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

	if (successCount > 0) {
		toast.add({
			title: t("homes.files.toasts.uploaded", { count: successCount }),
			color: "success",
		});
		emit("refresh");
	}

	if (errorCount > 0) {
		toast.add({
			title: t("homes.files.toasts.uploadFailed", { count: errorCount }),
			color: "error",
		});
	}
};

const uploadFiles = async (event: Event) => {
	const target = event.target as HTMLInputElement;
	const files = target.files;
	if (!files || files.length === 0) return;

	await uploadFileList(Array.from(files));
	target.value = "";
};

const moveFile = async (file: HomeFile, nextVisibility: "shared" | "private") => {
	if ((file.visibility || "shared") === nextVisibility) return;

	try {
		movingFileId.value = file.id;
		await $fetch(`/api/homes/${props.home.id}/files/move`, {
			method: "POST",
			headers: { Authorization: `Bearer ${await getFreshToken()}` },
			body: {
				fileId: file.id,
				targetVisibility: nextVisibility,
			},
		});
		toast.add({
			title: t("homes.files.toasts.moved", {
				target: nextVisibility === "private"
					? t("homes.files.destinations.private")
					: t("homes.files.destinations.shared"),
			}),
			color: "success",
		});
		emit("refresh");
	} catch (e: unknown) {
		toast.add({ title: t("homes.files.toasts.moveFailed"), description: getFetchError(e), color: "error" });
	} finally {
		movingFileId.value = null;
	}
};

const handleDragStart = (event: DragEvent, file: HomeFile) => {
	if (!event.dataTransfer) return;
	event.dataTransfer.effectAllowed = "move";
	event.dataTransfer.setData("application/x-home-file", JSON.stringify({
		fileId: file.id,
		visibility: file.visibility || (isPrivate.value ? "private" : "shared"),
	}));
};

const handleDrop = async (event: DragEvent) => {
	dragOverZone.value = false;

	const droppedFiles = event.dataTransfer?.files;
	if (droppedFiles && droppedFiles.length > 0) {
		await uploadFileList(Array.from(droppedFiles));
		return;
	}

	const payload = event.dataTransfer?.getData("application/x-home-file");
	if (!payload) return;

	try {
		const parsed = JSON.parse(payload) as { fileId?: string; visibility?: "shared" | "private" };
		if (!parsed.fileId || !parsed.visibility || parsed.visibility === (isPrivate.value ? "private" : "shared")) {
			return;
		}

		const file = [...(props.home.files || []), ...(props.home.privateFiles || [])].find((entry) => entry.id === parsed.fileId);
		if (!file) return;

		await moveFile(file, isPrivate.value ? "private" : "shared");
	} catch {
		// Ignore malformed drag payloads.
	}
};

const deleteFile = async (file: HomeFile) => {
	if (!confirm(t("homes.files.confirmDelete", { name: file.name }))) return;

	try {
		await $fetch(`/api/homes/${props.home.id}/files/delete`, {
			method: "POST",
			headers: { Authorization: `Bearer ${await getFreshToken()}` },
			body: { fileId: file.id, private: isPrivate.value },
		});
		toast.add({ title: t("homes.files.toasts.deleted"), color: "success" });
		emit("refresh");
	} catch (e: unknown) {
		toast.add({ title: t("homes.files.toasts.deleteFailed"), description: getFetchError(e), color: "error" });
	}
};

const requestFileUrl = async (file: HomeFile) => {
	const response = await $fetch<{ url: string }>(`/api/homes/${props.home.id}/files/download`, {
		headers: { Authorization: `Bearer ${await getFreshToken()}` },
		query: { fileId: file.id, private: isPrivate.value ? "true" : "false" },
	});

	return response.url;
};

const downloadFile = async (file: HomeFile) => {
	try {
		await openAfterAsyncNavigation(() => requestFileUrl(file));
	} catch (e: unknown) {
		toast.add({ title: t("homes.files.toasts.downloadFailed"), description: getFetchError(e), color: "error" });
	}
};

/* ---------------------------------- Rename --------------------------------- */

const renameTarget = ref<HomeFile | null>(null);
const renameValue = ref("");
const isRenaming = ref(false);

const isRenameModalOpen = computed({
	get: () => renameTarget.value !== null,
	set: (open: boolean) => {
		if (!open) renameTarget.value = null;
	},
});

const canSubmitRename = computed(() => {
	const value = renameValue.value.trim();
	return value.length > 0 && value !== renameTarget.value?.name;
});

const openRename = (file: HomeFile) => {
	renameTarget.value = file;
	renameValue.value = file.name;
};

const submitRename = async () => {
	const file = renameTarget.value;
	if (!file || !canSubmitRename.value) return;

	try {
		isRenaming.value = true;
		await $fetch(`/api/homes/${props.home.id}/files/rename`, {
			method: "POST",
			headers: { Authorization: `Bearer ${await getFreshToken()}` },
			body: { fileId: file.id, name: renameValue.value.trim() },
		});
		toast.add({ title: t("homes.files.toasts.renamed"), color: "success" });
		renameTarget.value = null;
		emit("refresh");
	} catch (e: unknown) {
		toast.add({ title: t("homes.files.toasts.renameFailed"), description: getFetchError(e), color: "error" });
	} finally {
		isRenaming.value = false;
	}
};

/* --------------------------------- Preview --------------------------------- */

const previewFile = ref<HomeFile | null>(null);
const previewUrl = ref("");
const previewLoading = ref(false);

/** Types the browser can render inline; everything else offers a download instead. */
const canPreview = (file: HomeFile) => canPreviewFile(file.type);

const openPreview = async (file: HomeFile) => {
	previewFile.value = file;
	previewUrl.value = "";
	previewLoading.value = true;

	try {
		previewUrl.value = await requestFileUrl(file);
	} catch (e: unknown) {
		previewFile.value = null;
		toast.add({ title: t("homes.files.toasts.previewFailed"), description: getFetchError(e), color: "error" });
	} finally {
		previewLoading.value = false;
	}
};

const closePreview = () => {
	previewFile.value = null;
	previewUrl.value = "";
};
</script>
