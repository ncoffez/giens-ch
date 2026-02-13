<script setup lang="ts">
const props = defineProps<{
	modelValue?: string;
}>();

const emit = defineEmits<{
	"update:modelValue": [value: string];
}>();

const { token } = useAuthReady();
const toast = useToast();

const activeTab = ref<"upload" | "giens" | "unsplash">("giens");
const isUploading = ref(false);
const dragover = ref(false);

const unsplashQuery = ref("");
const unsplashPage = ref(1);
const unsplashResults = ref<any[]>([]);
const unsplashTotalPages = ref(0);
const unsplashLoading = ref(false);
const hasSearched = ref(false);

const giensImages = [
	{ url: "/giens/giens-aerial.webp", name: "Luftaufnahme Giens" },
	{ url: "/giens/hauseingang_cropped.jpg", name: "Hauseingang" },
	{ url: "/giens/giensgarten.webp", name: "Garten" },
	{ url: "/giens/giensschaukeln.webp", name: "Schaukeln" },
	{ url: "/giens/hyeres.webp", name: "Hyères" },
	{ url: "/giens/strand-1.webp", name: "Strand 1" },
	{ url: "/giens/strand-2.webp", name: "Strand 2" },
	{ url: "/giens/strand-3.webp", name: "Strand 3" },
	{ url: "/giens/meer-1.webp", name: "Meer" },
	{ url: "/giens/meer-2.webp", name: "Meer 2" },
	{ url: "/giens/pizza.webp", name: "Pizza" },
	{ url: "/giens/felsen.webp", name: "Felsen" },
	{ url: "/giens/kite-2.webp", name: "Kitesurfen" },
	{ url: "/giens/kite-3.webp", name: "Kitesurfen 2" },
	{ url: "/giens/la-capte.webp", name: "La Capte" },
	{ url: "/giens/porquerolle.webp", name: "Porquerolles" },
	{ url: "/giens/gienseingangstor.webp", name: "Eingangstor" },
	{ url: "/giens/giensvorplatz.webp", name: "Vorplatz" },
	{ url: "/giens/giensregendusche.webp", name: "Regendusche" },
];

const selectImage = (url: string) => {
	emit("update:modelValue", url);
};

const handleFileDrop = (e: DragEvent) => {
	dragover.value = false;
	const files = e.dataTransfer?.files;
	if (files?.length) {
		uploadFile(files[0]);
	}
};

const handleFileSelect = (e: Event) => {
	const target = e.target as HTMLInputElement;
	if (target.files?.length) {
		uploadFile(target.files[0]);
	}
};

const uploadFile = async (file: File) => {
	if (!file.type.startsWith("image/")) {
		toast.add({ title: "Bitte wähle eine Bilddatei", color: "error" });
		return;
	}

	if (file.size > 10 * 1024 * 1024) {
		toast.add({ title: "Bild zu gross (max 10MB)", color: "error" });
		return;
	}

	try {
		isUploading.value = true;
		const reader = new FileReader();
		reader.onload = async () => {
			const base64 = reader.result as string;
			const result = await $fetch("/api/editor/upload", {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: {
					file: base64,
					filename: file.name,
					type: file.type,
				},
			});
			selectImage((result as any).url);
			toast.add({ title: "Bild hochgeladen", color: "success" });
		};
		reader.readAsDataURL(file);
	} catch (e: any) {
		toast.add({ title: "Fehler beim Hochladen", description: e.message, color: "error" });
	} finally {
		isUploading.value = false;
	}
};

const searchUnsplash = async (loadMore = false) => {
	const query = unsplashQuery.value.trim() || "mediterranean beach";
	
	try {
		unsplashLoading.value = true;
		const page = loadMore ? unsplashPage.value + 1 : 1;
		
		if (!loadMore) {
			unsplashResults.value = [];
		}
		
		const result = await $fetch("/api/unsplash", {
			params: { q: query, page },
		});

		if (loadMore) {
			unsplashResults.value = [...unsplashResults.value, ...(result as any).images];
		} else {
			unsplashResults.value = (result as any).images;
		}
		unsplashTotalPages.value = (result as any).totalPages;
		unsplashPage.value = page;
		hasSearched.value = true;
	} catch (e: any) {
		toast.add({ title: "Unsplash Suche fehlgeschlagen", color: "error" });
	} finally {
		unsplashLoading.value = false;
	}
};

const selectUnsplashImage = (img: any) => {
	selectImage(img.url);
};

const loadMoreUnsplash = () => {
	if (unsplashPage.value < unsplashTotalPages.value) {
		searchUnsplash(true);
	}
};

const handleTabChange = (tab: "upload" | "giens" | "unsplash") => {
	activeTab.value = tab;
	if (tab === "unsplash" && unsplashResults.value.length === 0) {
		searchUnsplash();
	}
};

const clearSearch = () => {
	unsplashQuery.value = "";
	unsplashResults.value = [];
	unsplashPage.value = 1;
	unsplashTotalPages.value = 0;
	hasSearched.value = false;
};
</script>

<template>
	<div class="space-y-4">
		<div class="flex border-b border-stone-200 dark:border-stone-700">
			<button
				v-for="tab in [{ id: 'upload', label: 'Hochladen', icon: 'i-lucide-upload' }, { id: 'giens', label: 'Giens', icon: 'i-lucide-image' }, { id: 'unsplash', label: 'Unsplash', icon: 'i-lucide-search' }]"
				:key="tab.id"
				@click="handleTabChange(tab.id as any)"
				class="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px"
				:class="activeTab === tab.id ? 'text-primary border-primary' : 'text-stone-500 border-transparent hover:text-stone-700 dark:hover:text-stone-300'"
			>
				<UIcon :name="tab.icon" class="w-4 h-4" />
				{{ tab.label }}
			</button>
		</div>

		<div v-if="activeTab === 'upload'" class="space-y-4">
			<div
				class="min-h-[200px] rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center p-8"
				:class="dragover ? 'border-primary bg-primary-50 dark:bg-primary-900/10' : 'border-stone-200 dark:border-stone-700'"
				@dragover.prevent="dragover = true"
				@dragleave.prevent="dragover = false"
				@drop.prevent="handleFileDrop"
			>
				<template v-if="isUploading">
					<div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
					<p class="mt-4 text-stone-500">Wird hochgeladen...</p>
				</template>
				<template v-else>
					<UIcon name="i-lucide-image-plus" class="w-12 h-12 text-stone-300 mb-4" />
					<p class="text-stone-500 mb-2">Bild hierher ziehen</p>
					<label class="cursor-pointer">
						<UButton as="span" color="primary" size="sm">oder Datei wählen</UButton>
						<input type="file" accept="image/*" class="hidden" @change="handleFileSelect" />
					</label>
				</template>
			</div>
		</div>

		<div v-else-if="activeTab === 'giens'" class="space-y-4">
			<p class="text-xs text-stone-500">Wähle ein Bild aus der Giens-Galerie:</p>
			<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-1">
				<button
					v-for="img in giensImages"
					:key="img.url"
					@click="selectImage(img.url)"
					class="group relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:border-primary"
					:class="modelValue === img.url ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'"
				>
					<img :src="img.url" :alt="img.name" class="w-full h-full object-cover" />
					<div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
						<UIcon v-if="modelValue === img.url" name="i-lucide-check" class="w-6 h-6 text-white" />
					</div>
				</button>
			</div>
		</div>

		<div v-else-if="activeTab === 'unsplash'" class="space-y-4">
			<div class="flex gap-2">
				<div class="relative flex-1">
					<UInput
						v-model="unsplashQuery"
						placeholder="Suchen auf Unsplash..."
						@keyup.enter="searchUnsplash()"
						class="w-full"
					/>
					<button
						v-if="unsplashQuery"
						@click="clearSearch"
						class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700"
					>
						<UIcon name="i-lucide-x" class="w-4 h-4 text-stone-400" />
					</button>
				</div>
				<UButton color="primary" :loading="unsplashLoading" @click="searchUnsplash()">Suchen</UButton>
			</div>

			<div v-if="unsplashLoading && unsplashResults.length === 0" class="flex items-center justify-center py-12">
				<div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>

			<div v-else-if="unsplashResults.length > 0" class="space-y-4">
				<div class="flex items-center justify-between">
					<p class="text-xs text-stone-500">
						{{ hasSearched ? `Ergebnisse für "${unsplashQuery || 'mediterranean beach'}"` : 'Vorschläge' }}
					</p>
					<UButton v-if="hasSearched" variant="ghost" color="neutral" size="xs" @click="clearSearch">
						Zurücksetzen
					</UButton>
				</div>
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
					<button
						v-for="img in unsplashResults"
						:key="img.id"
						@click="selectUnsplashImage(img)"
						class="group relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:border-primary"
						:class="modelValue === img.url ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'"
					>
						<img :src="img.thumb" :alt="img.description" class="w-full h-full object-cover" />
						<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
							<div class="absolute bottom-2 left-2 right-2">
								<p class="text-white text-xs font-medium truncate">{{ img.description }}</p>
								<p class="text-white/70 text-xs">von {{ img.author }}</p>
							</div>
						</div>
					</button>
				</div>

				<div v-if="unsplashPage < unsplashTotalPages" class="text-center">
					<UButton variant="soft" color="neutral" :loading="unsplashLoading" @click="loadMoreUnsplash">
						Weitere laden
					</UButton>
				</div>
			</div>

			<div v-else class="text-center py-12 text-stone-400">
				<UIcon name="i-lucide-search" class="w-12 h-12 mx-auto mb-4" />
				<p>Suche nach kostenlosen Bildern auf Unsplash</p>
			</div>
		</div>

		<div v-if="modelValue" class="pt-4 border-t border-stone-200 dark:border-stone-700">
			<p class="text-xs text-stone-500 mb-2">Ausgewähltes Bild:</p>
			<div class="flex items-center gap-4">
				<div class="w-24 h-24 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
					<img :src="modelValue" alt="Selected" class="w-full h-full object-cover" />
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium truncate">{{ modelValue }}</p>
					<UButton variant="ghost" color="neutral" size="xs" class="mt-2" @click="emit('update:modelValue', '')">
						Entfernen
					</UButton>
				</div>
			</div>
		</div>
	</div>
</template>