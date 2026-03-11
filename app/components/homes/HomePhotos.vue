<script setup lang="ts">
import type { Home } from "~/types";

const props = defineProps<{
	home: Home;
}>();

const emit = defineEmits<{
	refresh: [];
}>();

const { token } = useAuthReady();
const toast = useToast();

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
		toast.add({ title: `Maximal ${MAX_PHOTOS} Fotos erlaubt`, color: "error" });
		return;
	}

	const invalidFiles = fileArray.filter(f => !f.type.startsWith("image/"));
	if (invalidFiles.length > 0) {
		toast.add({ title: "Nur Bilddateien erlaubt", color: "error" });
		return;
	}

	const oversizedFiles = fileArray.filter(f => f.size > 10 * 1024 * 1024);
	if (oversizedFiles.length > 0) {
		toast.add({ title: "Datei zu gross (max. 10MB)", color: "error" });
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

			await $fetch(`/api/homes/${props.home.id}/photos/upload`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
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
			title: `${successCount} Foto${successCount > 1 ? "s" : ""} hochgeladen`,
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

const deletePhoto = async (photoUrl: string) => {
	if (!confirm("Foto wirklich löschen?")) return;

	try {
		await $fetch(`/api/homes/${props.home.id}/photos/delete`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { photoUrl },
		});
		toast.add({ title: "Foto gelöscht", color: "success" });
		emit("refresh");
	} catch (e: unknown) {
		toast.add({ title: "Löschen fehlgeschlagen", description: getFetchError(e), color: "error" });
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
						Hochladen... {{ uploadCurrent }}/{{ uploadTotal }}
					</p>
					<div class="w-full max-w-xs mx-auto">
						<UProgress :value="uploadProgress" color="primary" size="sm" />
					</div>
				</div>
				<div v-else class="space-y-3">
					<UIcon name="i-lucide-upload-cloud" class="w-10 h-10 mx-auto text-stone-400" />
					<p class="text-stone-600 dark:text-stone-400 font-medium">Klicken zum Hochladen</p>
					<p class="text-sm text-stone-400">{{ home.photos?.length || 0 }} / {{ MAX_PHOTOS }} Fotos</p>
					<p class="text-xs text-stone-400">Mehrere Dateien möglich</p>
				</div>
			</div>
			<input type="file" accept="image/*" multiple class="hidden" :disabled="uploading" @change="uploadPhotos" />
		</label>

		<!-- Photo grid -->
		<div v-if="home.photos?.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
			<div
				v-for="(photo, index) in home.photos"
				:key="index"
				class="relative group aspect-square rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800"
			>
				<img :src="photo" :alt="`Foto ${index + 1}`" class="w-full h-full object-cover" />
				<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
					<UButton
						color="error"
						variant="solid"
						size="sm"
						icon="i-lucide-trash-2"
						@click="deletePhoto(photo)"
					>
						Löschen
					</UButton>
				</div>
			</div>
		</div>

		<!-- Empty state -->
		<div v-else class="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-dashed border-stone-200 dark:border-stone-700">
			<UIcon name="i-lucide-image" class="w-10 h-10 mx-auto text-stone-300 mb-3" />
			<p class="text-stone-500">Keine Fotos</p>
			<p class="text-sm text-stone-400">Laden Sie Fotos hoch, die Mieter sehen können</p>
		</div>
	</div>
</template>