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
const MAX_PHOTOS = 30;

const uploadPhoto = async (event: Event) => {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];
	if (!file) return;

	if (!file.type.startsWith("image/")) {
		toast.add({ title: "Nur Bilddateien erlaubt", color: "error" });
		return;
	}

	if (file.size > 10 * 1024 * 1024) {
		toast.add({ title: "Datei zu gross (max. 10MB)", color: "error" });
		return;
	}

	if ((props.home.photos?.length || 0) >= MAX_PHOTOS) {
		toast.add({ title: `Maximal ${MAX_PHOTOS} Fotos erlaubt`, color: "error" });
		return;
	}

	try {
		uploading.value = true;
		const reader = new FileReader();
		reader.onload = async (e) => {
			const base64 = e.target?.result as string;
			await $fetch(`/api/homes/${props.home.id}/photos/upload`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: { file: base64, type: file.type },
			});
			toast.add({ title: "Foto hochgeladen", color: "success" });
			emit("refresh");
			uploading.value = false;
		};
		reader.readAsDataURL(file);
	} catch (e: unknown) {
		toast.add({ title: "Upload fehlgeschlagen", description: getFetchError(e), color: "error" });
		uploading.value = false;
	}

	target.value = "";
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
					<p class="text-stone-600 dark:text-stone-400">Hochladen...</p>
				</div>
				<div v-else class="space-y-3">
					<UIcon name="i-lucide-upload-cloud" class="w-10 h-10 mx-auto text-stone-400" />
					<p class="text-stone-600 dark:text-stone-400 font-medium">Klicken zum Hochladen</p>
					<p class="text-sm text-stone-400">{{ home.photos?.length || 0 }} / {{ MAX_PHOTOS }} Fotos</p>
				</div>
			</div>
			<input type="file" accept="image/*" class="hidden" :disabled="uploading" @change="uploadPhoto" />
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
