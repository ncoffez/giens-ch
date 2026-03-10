<script setup lang="ts">
import type { Home } from "../../../types";

const props = defineProps<{ home: Home }>();
const emit = defineEmits(["refresh"]);

const { token } = useAuthReady();
const toast = useToast();

const MAX_PHOTOS = 20;
const uploading = ref(false);
const dragOver = ref(false);

const uploadPhoto = async (file: File) => {
	if (!file.type.startsWith("image/")) {
		toast.add({ title: "Nur Bilddateien sind erlaubt", color: "error" });
		return;
	}

	if (file.size > 10 * 1024 * 1024) {
		toast.add({ title: "Datei ist zu groß (max. 10MB)", color: "error" });
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
			await $fetch(`/api/homes/${props.home.id}/photos.upload`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: { file: base64 },
			});
			toast.add({ title: "Foto erfolgreich hochgeladen", color: "success" });
			emit("refresh");
			uploading.value = false;
		};
		reader.readAsDataURL(file);
	} catch (e: unknown) {
		toast.add({ title: getFetchError(e) || "Upload fehlgeschlagen", color: "error" });
		uploading.value = false;
	}
};

const dropPhoto = async (e: DragEvent) => {
	e.preventDefault();
	dragOver.value = false;
	const file = e.dataTransfer?.files[0];
	if (file) await uploadPhoto(file);
};

const deletePhoto = async (photoUrl: string) => {
	if (!confirm("Dieses Foto löschen?")) return;

	try {
		await $fetch(`/api/homes/${props.home.id}/photos.delete`, {
			method: "post",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { photoUrl },
		});
		toast.add({ title: "Foto gelöscht", color: "success" });
		emit("refresh");
	} catch (e: unknown) {
		toast.add({ title: getFetchError(e) || "Löschen fehlgeschlagen", color: "error" });
	}
};

const openFileDialog = (e: Event) => {
	(e.currentTarget as HTMLElement).querySelector("input")?.click();
};

const handleFileSelect = (e: Event) => {
	const file = (e.target as HTMLInputElement).files?.[0];
	if (file) uploadPhoto(file);
};
</script>

<template>
	<div class="space-y-12">
		<div
			class="border-4 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all group"
			:class="dragOver ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-stone-100 dark:border-stone-800 hover:border-primary/20 hover:bg-gray-50/50 dark:hover:bg-gray-900/30'"
			@dragover.prevent="dragOver = true"
			@dragleave.prevent="dragOver = false"
			@drop.prevent="dropPhoto"
			@click="openFileDialog"
		>
			<input type="file" class="hidden" accept="image/*" @change="handleFileSelect" />
			<div class="inline-flex p-4 bg-white dark:bg-stone-900 rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
				<UIcon name="i-lucide-upload-cloud" class="w-10 h-10 text-primary" />
			</div>
			<p class="text-xl font-black mb-2">Fotos hierher ziehen oder klicken</p>
			<p class="text-sm text-stone-500 font-medium">
				{{ home.photos?.length || 0 }} von {{ MAX_PHOTOS }} Fotos · Max. 10MB pro Datei
			</p>
		</div>

		<div v-if="uploading" class="flex items-center justify-center gap-3 py-4 text-primary font-bold">
			<UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin" />
			Hochladen...
		</div>

		<div v-if="home.photos?.length" class="grid grid-cols-2 md:grid-cols-3 gap-6">
			<div
				v-for="(photo, index) in home.photos"
				:key="index"
				class="relative group aspect-[4/3] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-stone-100 dark:border-stone-800"
			>
				<img :src="photo" :alt="`Haus Foto ${index + 1}`" class="w-full h-full object-cover" loading="lazy" />
				<div
					class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
				>
					<UButton
						color="error"
						variant="solid"
						size="lg"
						icon="i-lucide-trash-2"
						class="rounded-full"
						@click.stop="deletePhoto(photo)"
					>
						Löschen
					</UButton>
				</div>
			</div>
		</div>

		<div v-else-if="!uploading" class="text-center py-20 bg-gray-50/30 dark:bg-stone-900/10 rounded-3xl border-2 border-dashed border-stone-100 dark:border-stone-800">
			<UIcon name="i-lucide-image-off" class="w-12 h-12 mx-auto text-stone-300 mb-4" />
			<p class="text-stone-500 font-medium">Noch keine Fotos vorhanden.</p>
		</div>
	</div>
</template>
