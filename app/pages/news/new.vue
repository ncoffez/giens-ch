<script lang="ts" setup>
import { getArticlePlaceholder } from "~/utils/placeholders";

definePageMeta({
	middleware: ["is-publisher"],
});

const content = ref("");
const title = ref("");
const intro = ref("");
const image = ref("");
const selectedTags = ref<string[]>([]);

const toast = useToast();
const { $token } = useNuxtApp();

const { data: labels } = await useFetch<any[]>("/api/labels");
const tagOptions = computed(() => labels.value?.map(l => ({ id: l.id, label: l.id })) || []);

const isPublishing = ref(false);
const activeStep = ref(0);

const steps = [
	{ id: 0, label: "Titel & Einleitung", icon: "i-lucide-type" },
	{ id: 1, label: "Bild & Kategorien", icon: "i-lucide-image" },
	{ id: 2, label: "Inhalt schreiben", icon: "i-lucide-file-text" },
];

const canProceed = computed(() => {
	if (activeStep.value === 0) return title.value.trim().length > 0;
	if (activeStep.value === 1) return true;
	if (activeStep.value === 2) return content.value.trim().length > 0;
	return true;
});

const effectiveImage = computed(() => {
	if (image.value) return image.value;
	return "/giens/giens-aerial.webp";
});

const nextStep = () => {
	if (activeStep.value < steps.length - 1) {
		activeStep.value++;
	}
};

const prevStep = () => {
	if (activeStep.value > 0) {
		activeStep.value--;
	}
};

const publish = async () => {
	if (!title.value || !content.value) {
		toast.add({ title: "Fehler", description: "Titel und Inhalt sind erforderlich.", color: "error" });
		return;
	}

	isPublishing.value = true;
	try {
		await $fetch("/api/news/create", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${$token.value}`
			},
			body: {
				title: title.value,
				intro: intro.value,
				body: content.value,
				image: image.value || null,
				tags: selectedTags.value
			}
		});
		toast.add({ title: "Erfolgreich", description: "Artikel veröffentlicht.", color: "success" });
		navigateTo("/news");
	} catch (e: any) {
		toast.add({ title: "Fehler", description: e.message, color: "error" });
	} finally {
		isPublishing.value = false;
	}
};

useHead({
	title: "Neuer Artikel"
});
</script>

<template>
	<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
		<!-- Header -->
		<header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
			<div class="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<UButton
						color="neutral"
						variant="ghost"
						icon="i-lucide-arrow-left"
						@click="navigateTo('/news')"
						class="rounded-full"
					/>
					<div>
						<h1 class="text-lg font-bold">Neuer Artikel</h1>
						<p class="text-xs text-gray-500">Erstelle einen neuen Artikel für die Gemeinschaft</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<UButton
						color="neutral"
						variant="ghost"
						@click="navigateTo('/news')"
					>
						Abbrechen
					</UButton>
					<UButton
						color="primary"
						:loading="isPublishing"
						@click="publish"
						icon="i-lucide-send"
						class="rounded-full px-6"
					>
						Veröffentlichen
					</UButton>
				</div>
			</div>
		</header>

		<!-- Progress Steps -->
		<div class="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
			<div class="max-w-screen-xl mx-auto px-4 sm:px-6 py-4">
				<div class="flex items-center justify-center gap-2 sm:gap-4">
					<template v-for="(step, index) in steps" :key="step.id">
						<button
							@click="activeStep = step.id"
							class="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-all"
							:class="activeStep === step.id 
								? 'bg-primary text-white shadow-lg shadow-primary/25' 
								: activeStep > step.id 
									? 'bg-primary-100 dark:bg-primary-900/30 text-primary' 
									: 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'"
						>
							<div 
								class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
								:class="activeStep === step.id ? 'bg-white/20' : activeStep > step.id ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'"
							>
								<UIcon v-if="activeStep > step.id" name="i-lucide-check" class="w-3 h-3" />
								<span v-else>{{ index + 1 }}</span>
							</div>
							<span class="text-sm font-medium hidden sm:inline">{{ step.label }}</span>
						</button>
						<div v-if="index < steps.length - 1" class="w-8 sm:w-12 h-0.5 rounded-full" :class="activeStep > step.id ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'" />
					</template>
				</div>
			</div>
		</div>

		<!-- Main Content -->
		<div class="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
			<div class="grid lg:grid-cols-5 gap-8">
				<!-- Form Area -->
				<div class="lg:col-span-3">
					<!-- Step 0: Title & Intro -->
					<div v-show="activeStep === 0" class="space-y-8">
						<div class="text-center mb-8">
							<div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
								<UIcon name="i-lucide-type" class="w-8 h-8 text-primary" />
							</div>
							<h2 class="text-2xl font-black">Wie heisst dein Artikel?</h2>
							<p class="text-gray-500 mt-1">Ein guter Titel zieht die Aufmerksamkeit auf sich</p>
						</div>

						<div class="max-w-xl mx-auto space-y-6">
							<div class="group">
								<label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
									Titel <span class="text-red-500">*</span>
								</label>
								<input
									v-model="title"
									type="text"
									placeholder="z.B. Sommerfest im Lotissement"
									class="w-full px-6 py-4 text-xl font-bold bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
								/>
								<p class="mt-2 text-xs text-gray-400">Maximal 80 Zeichen empfohlen</p>
							</div>

							<div class="group">
								<label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
									Einleitung
								</label>
								<textarea
									v-model="intro"
									placeholder="Eine kurze Zusammenfassung, die in der Übersicht angezeigt wird..."
									rows="4"
									class="w-full px-6 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
								/>
								<p class="mt-2 text-xs text-gray-400">Wird in der Artikelübersicht angezeigt</p>
							</div>
						</div>

						<div class="flex justify-center pt-8">
							<UButton
								color="primary"
								size="xl"
								:disabled="!canProceed"
								@click="nextStep"
								trailing
								icon="i-lucide-arrow-right"
								class="rounded-full px-8"
							>
								Weiter zum Bild
							</UButton>
						</div>
					</div>

					<!-- Step 1: Image & Categories -->
					<div v-show="activeStep === 1" class="space-y-8">
						<div class="text-center mb-8">
							<div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
								<UIcon name="i-lucide-image" class="w-8 h-8 text-primary" />
							</div>
							<h2 class="text-2xl font-black">Wähle ein Titelbild</h2>
							<p class="text-gray-500 mt-1">Ein Bild sagt mehr als tausend Worte</p>
						</div>

						<div class="max-w-2xl mx-auto space-y-8">
							<!-- Image Section - Full Width, Prominent -->
							<div class="space-y-4">
								<label class="block text-sm font-bold text-gray-700 dark:text-gray-300">
									Titelbild
								</label>
								
								<div v-if="!image" class="relative">
									<UiImagePicker v-model="image" />
								</div>
								
								<div v-else class="relative group">
									<div class="aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-lg">
										<img :src="image" alt="Selected image" class="w-full h-full object-cover" />
									</div>
									<div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-2xl flex items-center justify-center">
										<UButton
											color="white"
											variant="solid"
											icon="i-lucide-refresh-cw"
											@click="image = ''"
											class="opacity-0 group-hover:opacity-100 transition-opacity"
										>
											Bild ändern
										</UButton>
									</div>
								</div>

								<div v-if="!image" class="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800 flex gap-3">
									<UIcon name="i-lucide-lightbulb" class="text-amber-500 shrink-0" />
									<p class="text-xs text-amber-800 dark:text-amber-200">
										Tipp: Wenn du kein Bild auswählst, wird automatisch ein passendes Bild aus der Giens-Galerie verwendet.
									</p>
								</div>
							</div>

							<!-- Categories -->
							<div class="space-y-4">
								<label class="block text-sm font-bold text-gray-700 dark:text-gray-300">
									Kategorien
								</label>
								<USelectMenu
									v-model="selectedTags"
									multiple
									:items="tagOptions"
									value-key="id"
									label-key="label"
									placeholder="Wähle relevante Kategorien..."
									size="xl"
									class="w-full"
								/>
								<p class="text-xs text-gray-400">Kategorien helfen beim Auffinden des Artikels</p>
							</div>
						</div>

						<div class="flex justify-center gap-4 pt-8">
							<UButton
								color="neutral"
								variant="soft"
								size="xl"
								@click="prevStep"
								icon="i-lucide-arrow-left"
								class="rounded-full px-8"
							>
								Zurück
							</UButton>
							<UButton
								color="primary"
								size="xl"
								@click="nextStep"
								trailing
								icon="i-lucide-arrow-right"
								class="rounded-full px-8"
							>
								Weiter zum Inhalt
							</UButton>
						</div>
					</div>

					<!-- Step 2: Content -->
					<div v-show="activeStep === 2" class="space-y-6">
						<div class="text-center mb-8">
							<div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
								<UIcon name="i-lucide-file-text" class="w-8 h-8 text-primary" />
							</div>
							<h2 class="text-2xl font-black">Verfasse deinen Artikel</h2>
							<p class="text-gray-500 mt-1">Teile deine Geschichte mit der Gemeinschaft</p>
						</div>

						<div class="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
							<div class="border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
								<div class="flex items-center gap-3">
									<UIcon name="i-lucide-edit-3" class="text-primary" />
									<span class="font-bold">Artikelinhalt</span>
								</div>
								<div class="flex items-center gap-2 text-xs text-gray-400">
									<UIcon name="i-lucide-info" class="w-4 h-4" />
									<span>Füge Bilder und Links direkt im Editor ein</span>
								</div>
							</div>
							<div class="p-4">
								<TiptapEditor v-model="content" />
							</div>
						</div>

						<div class="flex justify-center gap-4 pt-4">
							<UButton
								color="neutral"
								variant="soft"
								size="xl"
								@click="prevStep"
								icon="i-lucide-arrow-left"
								class="rounded-full px-8"
							>
								Zurück
							</UButton>
							<UButton
								color="primary"
								size="xl"
								:disabled="!canProceed"
								:loading="isPublishing"
								@click="publish"
								icon="i-lucide-send"
								class="rounded-full px-8"
							>
								Artikel veröffentlichen
							</UButton>
						</div>
					</div>
				</div>

				<!-- Preview Panel -->
				<div class="lg:col-span-2">
					<div class="sticky top-28">
						<div class="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
							<div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
								<span class="text-sm font-bold text-gray-500">Live-Vorschau</span>
								<div class="flex items-center gap-2">
									<span class="relative flex h-2 w-2">
										<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
										<span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
									</span>
									<span class="text-xs text-green-600 font-medium">Aktiv</span>
								</div>
							</div>
							
							<div class="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-700">
								<img :src="effectiveImage" class="w-full h-full object-cover" />
								<div v-if="image" class="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
									<UIcon name="i-lucide-check" class="w-3 h-3" />
									Bild ausgewählt
								</div>
								<div v-else class="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
									<UIcon name="i-lucide-image" class="w-3 h-3" />
									Platzhalter
								</div>
							</div>
							
							<div class="p-6 space-y-4">
								<h3 class="text-xl font-black leading-tight">
									{{ title || 'Dein Titel erscheint hier...' }}
								</h3>
								
								<p class="text-sm text-gray-500 leading-relaxed line-clamp-3">
									{{ intro || 'Deine Einleitung erscheint hier als Vorschautext...' }}
								</p>
								
								<div v-if="selectedTags.length > 0" class="flex flex-wrap gap-2">
									<span
										v-for="tag in selectedTags"
										:key="tag"
										class="text-xs font-bold px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary"
									>
										{{ tag }}
									</span>
								</div>

								<div v-if="content" class="pt-4 border-t border-gray-100 dark:border-gray-700">
									<div class="flex items-center gap-2 text-xs text-gray-400">
										<UIcon name="i-lucide-file-text" class="w-4 h-4" />
										<span>{{ content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length }} Wörter</span>
									</div>
								</div>
							</div>
						</div>

						<!-- Status Card -->
						<div class="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
							<div class="flex items-center justify-between mb-3">
								<span class="text-sm font-bold text-gray-700 dark:text-gray-300">Artikelstatus</span>
							</div>
							<div class="space-y-2">
								<div class="flex items-center gap-2 text-sm">
									<UIcon 
										:name="title ? 'i-lucide-check-circle' : 'i-lucide-circle'" 
										:class="title ? 'text-green-500' : 'text-gray-300'" 
									/>
									<span :class="title ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'">Titel</span>
								</div>
								<div class="flex items-center gap-2 text-sm">
									<UIcon 
										:name="image ? 'i-lucide-check-circle' : 'i-lucide-circle'" 
										:class="image ? 'text-green-500' : 'text-gray-300'" 
									/>
									<span :class="image ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'">Bild (optional)</span>
								</div>
								<div class="flex items-center gap-2 text-sm">
									<UIcon 
										:name="content ? 'i-lucide-check-circle' : 'i-lucide-circle'" 
										:class="content ? 'text-green-500' : 'text-gray-300'" 
									/>
									<span :class="content ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'">Inhalt</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>