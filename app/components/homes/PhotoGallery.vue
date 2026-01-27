<script setup lang="ts">
const props = defineProps<{ home: any }>();
const emit = defineEmits(["refresh"]);

const { $token } = useNuxtApp();
const toast = useToast();

const MAX_PHOTOS = 20;
const uploading = ref(false);
const dragOver = ref(false);

const uploadPhoto = async (file: File) => {
	if (!file.type.startsWith("image/")) {
		toast.add({ title: "Only image files are allowed", color: "red" });
		return;
	}

	if (file.size > 10 * 1024 * 1024) {
		toast.add({ title: "File size exceeds 10MB limit", color: "red" });
		return;
	}

	if ((props.home.photos?.length || 0) >= MAX_PHOTOS) {
		toast.add({ title: `Maximum ${MAX_PHOTOS} photos allowed`, color: "red" });
		return;
	}

	try {
		uploading.value = true;
		const reader = new FileReader();
		reader.onload = async (e) => {
			const base64 = e.target?.result as string;
			await $fetch(`/api/homes/${props.home.id}/photos.upload`, {
				method: "POST",
				headers: { Authorization: `Bearer ${$token.value}` },
				body: { file: base64 },
			});
			toast.add({ title: "Photo uploaded successfully", color: "green" });
			emit("refresh");
			uploading.value = false;
		};
		reader.readAsDataURL(file);
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Failed to upload photo", color: "red" });
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
	if (!confirm("Delete this photo?")) return;

	try {
		await $fetch(`/api/homes/${props.home.id}/photos.delete`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: { photoUrl },
		});
		toast.add({ title: "Photo deleted", color: "green" });
		emit("refresh");
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Failed to delete photo", color: "red" });
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
	<UCard>
		<div
			class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
			:class="dragOver ? 'border-primary bg-primary/5' : 'border-gray-300'"
			@dragover.prevent="dragOver = true"
			@dragleave.prevent="dragOver = false"
			@drop.prevent="dropPhoto"
			@click="openFileDialog"
		>
			<input type="file" class="hidden" accept="image/*" @change="handleFileSelect" />
			<UIcon name="i-lucide-upload-cloud" class="w-12 h-12 mx-auto mb-4 text-gray-400" />
			<p class="text-lg font-medium mb-2">Drop photos here or click to upload</p>
			<p class="text-sm text-gray-500">
				{{ home.photos?.length || 0 }}/{{ MAX_PHOTOS }} photos · Max 10MB each
			</p>
		</div>

		<div v-if="uploading" class="mt-4 text-center text-gray-500">Uploading...</div>

		<div v-if="home.photos?.length" class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
			<div
				v-for="(photo, index) in home.photos"
				:key="index"
				class="relative group aspect-square rounded-lg overflow-hidden"
			>
				<img :src="photo" :alt="`Home photo ${index + 1}`" class="w-full h-full object-cover" />
				<div
					class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
				>
					<UButton
						color="red"
						variant="ghost"
						size="icon"
						@click="deletePhoto(photo)"
					>
						<UIcon name="i-lucide-trash-2" class="w-6 h-6 text-white" />
					</UButton>
				</div>
			</div>
		</div>

		<div v-else-if="!uploading" class="mt-4 text-center text-gray-500">
			No photos yet. Upload some to showcase your home!
		</div>
	</UCard>
</template>