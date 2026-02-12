<script lang="ts" setup>
import { getArticlePlaceholder } from "~/utils/placeholders";

definePageMeta({
	middleware: ["is-publisher"],
});

const route = useRoute();
const articleId = computed(() => route.params.id as string);

const { $token } = useNuxtApp();
const toast = useToast();

const title = ref("");
const intro = ref("");
const content = ref("");
const image = ref("");
const selectedTags = ref<string[]>([]);
const loading = ref(true);
const saving = ref(false);

const { data: labels } = await useFetch<any[]>("/api/labels");
const tagOptions = computed(() => labels.value?.map(l => ({ id: l.id, label: l.id })) || []);

const effectiveImage = computed(() => {
	if (image.value) return image.value;
	return getArticlePlaceholder(title.value || articleId.value);
});

const fetchArticle = async () => {
	try {
		loading.value = true;
		const article = await $fetch(`/api/getArticle`, {
			method: "POST",
			body: { id: articleId.value },
			headers: { Authorization: `Bearer ${$token.value}` },
		});

		title.value = article.title || "";
		intro.value = article.intro || "";
		content.value = article.body || "";
		image.value = article.image || "";
		selectedTags.value = article.tags || [];
	} catch (e: any) {
		toast.add({ title: "Fehler beim Laden", description: e.message, color: "error" });
		navigateTo("/news");
	} finally {
		loading.value = false;
	}
};

const save = async () => {
	if (!title.value || !content.value) {
		toast.add({ title: "Fehler", description: "Titel und Inhalt sind erforderlich.", color: "error" });
		return;
	}

	saving.value = true;
	try {
		await $fetch(`/api/news/${articleId.value}/update`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: {
				title: title.value,
				intro: intro.value,
				body: content.value,
				image: image.value || null,
				tags: selectedTags.value
			}
		});
		toast.add({ title: "Artikel aktualisiert", color: "success" });
		navigateTo(`/article/${articleId.value}`);
	} catch (e: any) {
		toast.add({ title: "Fehler beim Speichern", description: e.message, color: "error" });
	} finally {
		saving.value = false;
	}
};

onMounted(fetchArticle);
</script>

<template>
	<div class="max-w-screen-lg mx-auto px-4 py-8 space-y-8">
		<nav class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" @click="navigateTo('/news')" />
				<h1 class="text-3xl font-black tracking-tight">Artikel bearbeiten</h1>
			</div>
			<div class="flex gap-3">
				<UButton color="neutral" variant="soft" @click="navigateTo(`/article/${articleId}`)">Vorschau</UButton>
				<UButton color="primary" :loading="saving" @click="save" icon="i-lucide-save" class="rounded-full px-6">Speichern</UButton>
			</div>
		</nav>

		<div v-if="loading" class="flex items-center justify-center py-20">
			<div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
		</div>

		<template v-else>
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div class="lg:col-span-2 space-y-8">
					<UFormField label="Titel" required description="Ein aussagekräftiger Titel für Ihren Artikel">
						<UInput v-model="title" placeholder="Titel eingeben..." size="xl" class="font-bold" />
					</UFormField>

					<UFormField label="Einleitung" description="Wird in der Übersicht als Vorschau angezeigt">
						<UTextarea v-model="intro" placeholder="Kurze Zusammenfassung..." :rows="3" size="lg" />
					</UFormField>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<UFormField label="Kategorien">
							<USelectMenu
								v-model="selectedTags"
								multiple
								:items="tagOptions"
								value-key="id"
								label-key="label"
								placeholder="Kategorien wählen..."
								size="lg"
								class="w-full"
							/>
						</UFormField>
					</div>

					<UFormField label="Titelbild">
						<div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
							<ImagePicker v-model="image" />
						</div>
					</UFormField>
				</div>

				<div class="lg:col-span-1 space-y-6">
					<div class="sticky top-24">
						<div class="p-1 bg-gray-100 dark:bg-gray-800 rounded-[2rem]">
							<div class="bg-white dark:bg-gray-950 rounded-[1.8rem] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-xl">
								<div class="aspect-video relative overflow-hidden">
									<img :src="effectiveImage" class="w-full h-full object-cover" />
									<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
										<p class="text-white text-xs font-black uppercase tracking-widest">Vorschau</p>
									</div>
								</div>
								<div class="p-6 space-y-3">
									<h3 class="font-black text-lg leading-tight line-clamp-2">{{ title || 'Titel Vorschau' }}</h3>
									<p class="text-sm text-gray-500 line-clamp-3 italic">{{ intro || 'Ihre Einleitung erscheint hier...' }}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-bold flex items-center gap-2">
						<UIcon name="i-lucide-file-text" class="text-primary" />
						Inhalt
					</h2>
				</div>
				<div class="border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-inner bg-gray-50 dark:bg-gray-900">
					<TiptapEditor v-model="content" />
				</div>
			</div>
		</template>
	</div>
</template>