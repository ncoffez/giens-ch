<script setup lang="ts">
const modelValue = defineModel<boolean>();

const emit = defineEmits(["updated"]);

const { $currentUser } = useNuxtApp();
const { token } = useAuthReady();
const toast = useAppToast();

const loading = ref(false);
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const { data: picturesData, refresh: refreshPictures, pending } = useFetch("/api/profile/pictures", {
	headers: computed(() => ({ 
		Authorization: `Bearer ${token.value}` 
	})),
	immediate: false
});

watch(modelValue, (isOpen) => {
	if (isOpen && token.value) {
		refreshPictures();
	}
});

const previousPictures = computed(() => (picturesData.value as any)?.pictures || []);

function isCurrentPicture(url: string): boolean {
	return $currentUser.value?.photoURL === url;
}

async function selectPicture(url: string) {
	loading.value = true;
	try {
		await $fetch("/api/profile/picture-select", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { photoURL: url }
		});
		
		// Update local user state if possible
		if ($currentUser.value) {
			$currentUser.value.photoURL = url;
		}
		
		toast.success("Profilbild aktualisiert");
		
		emit("updated");
		modelValue.value = false;
	} catch (error: unknown) {
		toast.error("Fehler", error.message || "Konnte Profilbild nicht aktualisieren");
	} finally {
		loading.value = false;
	}
}

function triggerFileInput() {
	fileInput.value?.click();
}

async function handleFileChange(event: Event) {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];
	if (!file) return;

	if (!file.type.startsWith("image/")) {
		toast.error("Fehler", "Nur Bilder sind erlaubt");
		return;
	}

	uploading.value = true;
	try {
		const reader = new FileReader();
		const base64Promise = new Promise<string>((resolve) => {
			reader.onload = (e) => resolve(e.target?.result as string);
			reader.readAsDataURL(file);
		});
		
		const base64 = await base64Promise;
		
		const response = await $fetch<any>("/api/profile/picture-upload", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { file: base64 }
		});

		if ($currentUser.value) {
			$currentUser.value.photoURL = response.photoURL;
		}

		toast.success("Bild hochgeladen");

		await refreshPictures();
		
		// Add delay to ensure storage consistency before parent refresh
		setTimeout(() => {
			emit("updated");
			modelValue.value = false;
		}, 500);
	} catch (error: unknown) {
		toast.error("Upload fehlgeschlagen", error.message);
	} finally {
		uploading.value = false;
		if (fileInput.value) fileInput.value.value = "";
	}
}
</script>

<template>
	<UModal :open="modelValue" @update:open="modelValue = $event" title="Profilbild ändern">
		<template #content>
			<div class="p-6 space-y-8">
				<div class="flex flex-col items-center gap-4">
					<UAvatar
						:src="$currentUser?.photoURL"
						size="xl"
						class="w-24 h-24 ring-4 ring-primary/10 shadow-lg"
					/>
					<div class="text-center">
						<h3 class="font-bold text-lg">Dein aktuelles Profilbild</h3>
						<p class="text-sm text-stone-500">Klicke auf ein Bild unten oder lade ein neues hoch.</p>
					</div>
				</div>

				<div v-if="previousPictures.length > 0" class="space-y-4">
					<h4 class="text-sm font-bold uppercase tracking-wider text-stone-400">Vorherige Bilder</h4>
					<div class="grid grid-cols-5 gap-2">
						<div
							v-for="pic in previousPictures"
							:key="pic.url"
							class="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
							@click="selectPicture(pic.url)"
						>
							<img :src="pic.url" class="w-full h-full object-cover transition-transform group-hover:scale-110" />
							<div v-if="isCurrentPicture(pic.url)" class="absolute inset-0 bg-primary/20 flex items-center justify-center">
								<UIcon name="i-lucide-check" class="w-6 h-6 text-white bg-primary rounded-full p-1" />
							</div>
							<div v-else class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
						</div>
					</div>
				</div>
				<div v-else-if="!pending" class="py-8 text-center bg-stone-50 dark:bg-zinc-900 rounded-xl border-2 border-dashed border-stone-100 dark:border-zinc-800">
					<UIcon name="i-lucide-image-plus" class="w-12 h-12 text-stone-300 mx-auto mb-2" />
					<p class="text-sm text-stone-400">Noch keine Profilbilder in deiner Galerie.</p>
				</div>

				<div class="pt-4 border-t border-stone-100 dark:border-stone-800">
					<UButton
						block
						size="lg"
						color="neutral"
						variant="soft"
						icon="i-lucide-upload"
						:loading="uploading"
						@click="triggerFileInput"
					>
						Neues Bild hochladen
					</UButton>
					<input
						ref="fileInput"
						type="file"
						accept="image/*"
						class="hidden"
						@change="handleFileChange"
					/>
					<div v-if="uploading" class="mt-4">
						<UProgress animation="carousel" color="primary" size="sm" />
						<p class="text-xs text-center text-stone-500 mt-2">Bild wird optimiert und hochgeladen...</p>
					</div>
				</div>
			</div>
		</template>
	</UModal>
</template>
