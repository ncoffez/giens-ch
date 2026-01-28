<template>
	<div class="max-w-screen-md mx-auto px-4 py-12">
		<div class="mb-8">
			<NuxtLink to="/profile/me" class="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
				<UIcon name="i-lucide-arrow-left" />
				zurück
			</NuxtLink>
		</div>
		
		<h1 class="text-3xl font-bold mb-8">Profilbild ändern</h1>
		
		<UCard>
			<div class="space-y-6">
				<div class="flex items-center gap-6">
					<UAvatar 
						:src="$currentUser.value?.photoURL" 
						:alt="$currentUser.value?.displayName" 
						size="xl" 
						class="w-24 h-24"
						:ui="{ 
							rounded: 'rounded-full',
							text: 'text-2xl font-black'
						}"
					/>
					<div>
						<p class="text-gray-500 text-sm">
							Wählen Sie ein Bild von Ihrem Gerät. Das Bild sollte quadratisch sein.
						</p>
					</div>
				</div>
				
				<div>
					<UButton icon="i-lucide-upload" @click="triggerFileInput">
						Bild hochladen
					</UButton>
					<input 
						ref="fileInput" 
						type="file" 
						accept="image/*" 
						class="hidden" 
						@change="handleFileChange"
					/>
				</div>
				
				<div v-if="preview" class="space-y-4">
					<h3 class="font-bold">Vorschau</h3>
					<img :src="preview" alt="Preview" class="w-32 h-32 object-cover rounded-full" />
					<div>
						<UButton color="neutral" variant="ghost" @click="clearPreview">
							Abbrechen
						</UButton>
						<UButton color="primary" @click="uploadProfilePicture" :loading="loading">
							Speichern
						</UButton>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup lang="ts">
import { updateProfile } from "firebase/auth";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const { $currentUser } = useNuxtApp();
const toast = useToast();

if (!$currentUser?.value) {
	navigateTo('/login');
}

const fileInput = ref<HTMLInputElement | null>(null);
const preview = ref<string | null>(null);
const selectedFile = ref<File | null>(null);
const loading = ref(false);

function triggerFileInput() {
	fileInput.value?.click();
}

function handleFileChange(event: Event) {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];
	if (!file) return;
	
	if (!file.type.startsWith("image/")) {
		toast.add({
			color: "error",
			title: "Fehler",
			description: "Bitte wählen Sie ein Bild aus."
		});
		return;
	}
	
	selectedFile.value = file;
	const reader = new FileReader();
	reader.onload = (e) => {
		preview.value = e.target?.result as string;
	};
	reader.readAsDataURL(file);
}

function clearPreview() {
	preview.value = null;
	selectedFile.value = null;
	if (fileInput.value) {
		fileInput.value.value = "";
	}
}

async function uploadProfilePicture() {
	if (!$currentUser?.value) {
		navigateTo('/login');
		return;
	}

	if (!selectedFile.value) return;
		
	loading.value = true;
	try {
		const storage = getStorage();
		const fileRef = storageRef(storage, `profile-pictures/${$currentUser.value.uid}/${Date.now()}`);
		await uploadBytes(fileRef, selectedFile.value);
		const downloadURL = await getDownloadURL(fileRef);
		
		await updateProfile($currentUser.value, {
			photoURL: downloadURL
		});
		
		toast.add({
			color: "success",
			title: "Erfolg",
			description: "Profilbild wurde aktualisiert."
		});
		
		navigateTo("/profile/me");
	} catch (error: any) {
		toast.add({
			color: "error",
			title: "Fehler",
			description: error.message || "Konnte Profilbild nicht hochladen."
		});
	} finally {
		loading.value = false;
	}
}
</script>