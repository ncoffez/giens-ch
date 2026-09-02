<script setup lang="ts">
import type { Home } from "~/types";
import { isSameOrder, movePhoto } from "~/utils/photoOrder";

const props = defineProps<{
	home: Home;
}>();

const emit = defineEmits<{
	refresh: [];
}>();

const { getFreshToken } = useAuthReady();
const toast = useToast();
const { t } = useI18n();

const uploading = ref(false);
const uploadProgress = ref(0);
const uploadTotal = ref(0);
const uploadCurrent = ref(0);
const MAX_PHOTOS = 30;

const uploadPhotos = async (event: Event) => {
	const target = event.target as HTMLInputElement;
	const files = target.files;
	if (!files || files.length === 0) return;

	const fileArray = Array.from(files);
	const currentCount = props.home.photos?.length || 0;

	if (currentCount + fileArray.length > MAX_PHOTOS) {
		toast.add({ title: t("homes.photos.toasts.maxPhotos", { count: MAX_PHOTOS }), color: "error" });
		return;
	}

	const invalidFiles = fileArray.filter(f => !f.type.startsWith("image/"));
	if (invalidFiles.length > 0) {
		toast.add({ title: t("homes.photos.toasts.imagesOnly"), color: "error" });
		return;
	}

	const oversizedFiles = fileArray.filter(f => f.size > 10 * 1024 * 1024);
	if (oversizedFiles.length > 0) {
		toast.add({ title: t("homes.photos.toasts.maxSize"), color: "error" });
		return;
	}

	await flushPendingOrder();

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

			await $fetch(`/api/homes/${props.home.id}/photos/upload`, {
				method: "POST",
				headers: { Authorization: `Bearer ${authToken}` },
				body: { file: base64, type: file.type },
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
			title: t("homes.photos.toasts.uploaded", { count: successCount }),
			color: "success",
		});
		emit("refresh");
	}

	if (errorCount > 0) {
		toast.add({
			title: t("homes.photos.toasts.uploadFailed", { count: errorCount }),
			color: "error",
		});
	}
};

/* -------------------------------- Ordering -------------------------------- */

// The grid renders from this local copy, keyed by photo URL, so reordering only
// moves existing DOM nodes: no refetch, no image reload, no scroll jump. The
// server is updated in the background and the parent is never asked to refresh,
// because a refresh would tear the grid down and reload every image.
const orderedPhotos = ref<string[]>([...(props.home.photos || [])]);
const draggedIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

type OrderStatus = "idle" | "saving" | "saved";
const orderStatus = ref<OrderStatus>("idle");

const SAVE_DEBOUNCE_MS = 700;
const SAVED_BADGE_MS = 2000;

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let savedBadgeTimer: ReturnType<typeof setTimeout> | null = null;
// The last order the server acknowledged; used to roll back a failed save.
let confirmedOrder = [...(props.home.photos || [])];

const hasUnsavedOrder = () => saveTimer !== null || orderStatus.value === "saving";

watch(() => props.home.photos, (photos) => {
	// Ignore incoming props while our own order is still in flight, otherwise a
	// parent refresh triggered by an upload or delete would revert the drag.
	if (hasUnsavedOrder()) return;

	const next = [...(photos || [])];
	if (isSameOrder(next, orderedPhotos.value)) return;

	orderedPhotos.value = next;
	confirmedOrder = next;
}, { deep: true });

const flushOrder = async () => {
	saveTimer = null;
	const nextOrder = [...orderedPhotos.value];

	if (isSameOrder(nextOrder, confirmedOrder)) {
		orderStatus.value = "idle";
		return;
	}

	const rollbackTo = [...confirmedOrder];

	try {
		orderStatus.value = "saving";
		await $fetch(`/api/homes/${props.home.id}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${await getFreshToken()}` },
			body: { photos: nextOrder },
		});

		confirmedOrder = nextOrder;
		orderStatus.value = "saved";

		if (savedBadgeTimer) clearTimeout(savedBadgeTimer);
		savedBadgeTimer = setTimeout(() => {
			if (orderStatus.value === "saved") orderStatus.value = "idle";
		}, SAVED_BADGE_MS);
	} catch (e: unknown) {
		orderedPhotos.value = rollbackTo;
		orderStatus.value = "idle";
		toast.add({ title: t("homes.photos.toasts.orderFailed"), description: getFetchError(e), color: "error" });
	}
};

/** Sends a pending reorder now, so uploads and deletes never race with it. */
const flushPendingOrder = async () => {
	if (!saveTimer) return;

	clearTimeout(saveTimer);
	await flushOrder();
};

/** Applies the move immediately and coalesces rapid moves into a single save. */
const applyOrder = (nextOrder: string[]) => {
	if (isSameOrder(nextOrder, orderedPhotos.value)) return;

	orderedPhotos.value = nextOrder;

	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => { void flushOrder(); }, SAVE_DEBOUNCE_MS);
};

const movePhotoTo = (from: number, to: number) => applyOrder(movePhoto(orderedPhotos.value, from, to));

const handleDragStart = (index: number) => {
	draggedIndex.value = index;
};

const handleDragOver = (index: number) => {
	if (draggedIndex.value === null) return;
	dragOverIndex.value = index;
};

const handleDrop = (index: number) => {
	const from = draggedIndex.value;
	draggedIndex.value = null;
	dragOverIndex.value = null;

	if (from === null || from === index) return;
	movePhotoTo(from, index);
};

const handleDragEnd = () => {
	draggedIndex.value = null;
	dragOverIndex.value = null;
};

// Never leave a pending reorder behind when the section is closed.
onBeforeUnmount(() => {
	if (savedBadgeTimer) clearTimeout(savedBadgeTimer);
	if (!saveTimer) return;

	clearTimeout(saveTimer);
	void flushOrder();
});

const deletePhoto = async (photoUrl: string) => {
	if (!confirm(t("homes.photos.confirmDelete"))) return;

	await flushPendingOrder();

	try {
		await $fetch(`/api/homes/${props.home.id}/photos/delete`, {
			method: "POST",
			headers: { Authorization: `Bearer ${await getFreshToken()}` },
			body: { photoUrl },
		});
		toast.add({ title: t("homes.photos.toasts.deleted"), color: "success" });
		emit("refresh");
	} catch (e: unknown) {
		toast.add({ title: t("homes.photos.toasts.deleteFailed"), description: getFetchError(e), color: "error" });
	}
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
						{{ t("homes.photos.uploading", { current: uploadCurrent, total: uploadTotal }) }}
					</p>
					<div class="w-full max-w-xs mx-auto">
						<UProgress :value="uploadProgress" color="primary" size="sm" />
					</div>
				</div>
				<div v-else class="space-y-3">
					<UIcon name="i-lucide-upload-cloud" class="w-10 h-10 mx-auto text-stone-400" />
					<p class="text-stone-600 dark:text-stone-400 font-medium">{{ t("homes.photos.clickToUpload") }}</p>
					<p class="text-sm text-stone-400">{{ t("homes.photos.count", { current: home.photos?.length || 0, max: MAX_PHOTOS }) }}</p>
					<p class="text-xs text-stone-400">{{ t("homes.photos.multiUpload") }}</p>
				</div>
			</div>
			<input type="file" accept="image/*" multiple class="hidden" :disabled="uploading" @change="uploadPhotos" />
		</label>

		<!-- Photo grid -->
		<div v-if="orderedPhotos.length" class="space-y-3">
			<div class="flex items-center gap-2 text-sm text-stone-500">
				<UIcon name="i-lucide-move" class="w-4 h-4" />
				<span>{{ t("homes.photos.reorderHint") }}</span>
				<!-- Quiet inline status instead of a toast per move. -->
				<span
					v-if="orderStatus !== 'idle'"
					class="inline-flex items-center gap-1.5 transition-opacity"
					:class="orderStatus === 'saved' ? 'text-emerald-600 dark:text-emerald-400' : ''"
				>
					<UIcon
						:name="orderStatus === 'saving' ? 'i-lucide-loader-circle' : 'i-lucide-check'"
						class="w-4 h-4"
						:class="orderStatus === 'saving' ? 'animate-spin' : ''"
					/>
					{{ orderStatus === "saving" ? t("homes.photos.orderSaving") : t("homes.photos.toasts.orderSaved") }}
				</span>
			</div>

			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
				<div
					v-for="(photo, index) in orderedPhotos"
					:key="photo"
					draggable="true"
					class="relative group aspect-square rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 transition-all"
					:class="{
						'opacity-40': draggedIndex === index,
						'ring-2 ring-primary ring-offset-2 dark:ring-offset-stone-900': dragOverIndex === index && draggedIndex !== index,
					}"
					@dragstart="handleDragStart(index)"
					@dragover.prevent="handleDragOver(index)"
					@drop.prevent="handleDrop(index)"
					@dragend="handleDragEnd"
				>
					<img :src="photo" :alt="t('homes.photos.photoAlt', { index: index + 1 })" class="w-full h-full object-cover" />

					<!-- Position badge -->
					<span class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs font-semibold">
						{{ index + 1 }}
					</span>

					<!-- Arrow controls stay visible on touch devices, where dragging is awkward. -->
					<div class="absolute inset-x-0 bottom-0 flex items-center justify-between p-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
						<UButton
							color="neutral"
							variant="solid"
							size="xs"
							icon="i-lucide-chevron-left"
							:disabled="index === 0"
							:title="t('homes.photos.moveEarlier')"
							:aria-label="t('homes.photos.moveEarlier')"
							@click="movePhotoTo(index, index - 1)"
						/>
						<UButton
							color="neutral"
							variant="solid"
							size="xs"
							icon="i-lucide-chevron-right"
							:disabled="index === orderedPhotos.length - 1"
							:title="t('homes.photos.moveLater')"
							:aria-label="t('homes.photos.moveLater')"
							@click="movePhotoTo(index, index + 1)"
						/>
					</div>

					<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
						<UButton
							color="error"
							variant="solid"
							size="sm"
							icon="i-lucide-trash-2"
							class="pointer-events-auto"
							@click="deletePhoto(photo)"
						>{{ t("documents.actions.delete") }}</UButton>
					</div>
				</div>
			</div>
		</div>

		<!-- Empty state -->
		<div v-else class="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-dashed border-stone-200 dark:border-stone-700">
			<UIcon name="i-lucide-image" class="w-10 h-10 mx-auto text-stone-300 mb-3" />
			<p class="text-stone-500">{{ t("homes.photos.emptyTitle") }}</p>
			<p class="text-sm text-stone-400">{{ t("homes.photos.emptyDescription") }}</p>
		</div>
	</div>
</template>
