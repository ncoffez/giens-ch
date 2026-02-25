<script lang="ts" setup>
definePageMeta({
	middleware: ["is-publisher"],
});

const route = useRoute();
const articleId = computed(() => route.params.id as string);

const { $isAdmin, $currentUser } = useNuxtApp() as any;
const { waitForAuth, token } = useAuthReady();
const toast = useToast();

const title = ref("");
const intro = ref("");
const content = ref("");
const image = ref("");
const selectedTags = ref<string[]>([]);
const selectedAuthor = ref<{ id: string; name: string } | null>(null);
const articleAuthorUid = ref<string | null>(null);
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const notAuthorized = ref(false);

const { data: labels } = await useFetch<any[]>("/api/labels");
const tagOptions = computed(() => labels.value?.map(l => ({ id: l.id, label: l.id })) || []);

const { data: users } = await useFetch<any[]>("/api/users", {
	headers: { Authorization: `Bearer ${token.value}` },
});
const authorOptions = computed(() => {
	if (!users.value) return [];
	return users.value.map(u => ({
		id: u.uid,
		name: u.displayName || u.email || u.uid
	}));
});

const effectiveImage = computed(() => {
	if (image.value) return image.value;
	return "/giens/giens-aerial.webp";
});

const fetchArticle = async () => {
	try {
		await waitForAuth();
		loading.value = true;
		const article = await $fetch(`/api/getArticle`, {
			method: "POST",
			body: { id: articleId.value },
			headers: { Authorization: `Bearer ${token.value}` },
		});

		articleAuthorUid.value = article.authorUid || null;
		
		const currentUserUid = $currentUser?.value?.uid;
		if (!$isAdmin.value && article.authorUid && article.authorUid !== currentUserUid) {
			notAuthorized.value = true;
			toast.add({ title: "Keine Berechtigung", description: "Du kannst nur deine eigenen Artikel bearbeiten.", color: "error" });
			return;
		}

		title.value = article.title || "";
		intro.value = article.intro || "";
		content.value = article.body || "";
		image.value = article.image || "";
		selectedTags.value = article.tags || [];
		if (article.authorUid && article.author) {
			selectedAuthor.value = { id: article.authorUid, name: article.author };
		}
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Laden", description: getErrorMessage(e), color: "error" });
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
		const body: Record<string, any> = {
			title: title.value,
			intro: intro.value,
			body: content.value,
			image: image.value || null,
			tags: selectedTags.value,
		};

		if ($isAdmin.value && selectedAuthor.value) {
			body.authorName = selectedAuthor.value.name;
			body.authorUid = selectedAuthor.value.id;
		}

		await $fetch(`/api/news/${articleId.value}/update`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body
		});
		toast.add({ title: "Artikel aktualisiert", color: "success" });
		navigateTo(`/article/${articleId.value}`);
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Speichern", description: getErrorMessage(e), color: "error" });
	} finally {
		saving.value = false;
	}
};

const deleteArticle = async () => {
	if (!confirm("Artikel wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
		return;
	}

	deleting.value = true;
	try {
		await $fetch(`/api/news/${articleId.value}/delete`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
		});
		toast.add({ title: "Artikel gelöscht", color: "success" });
		navigateTo("/news");
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Löschen", description: getErrorMessage(e), color: "error" });
	} finally {
		deleting.value = false;
	}
};

onMounted(fetchArticle);

useHead({
	title: "Artikel bearbeiten"
});
</script>

<template>
	<div class="min-h-screen bg-stone-50 dark:bg-stone-900">
		<!-- Header -->
		<header class="sticky top-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-b border-stone-100 dark:border-stone-800">
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
						<h1 class="text-lg font-bold">Artikel bearbeiten</h1>
						<p class="text-xs text-stone-500">Bearbeite den bestehenden Artikel</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<UButton
						v-if="$isAdmin"
						color="error"
						variant="ghost"
						icon="i-lucide-trash-2"
						:loading="deleting"
						@click="deleteArticle"
						class="rounded-full"
					>
						Löschen
					</UButton>
					<UButton
						color="neutral"
						variant="soft"
						@click="navigateTo(`/article/${articleId}`)"
						icon="i-lucide-external-link"
					>
						Vorschau
					</UButton>
					<UButton
						color="primary"
						:loading="saving"
						@click="save"
						icon="i-lucide-save"
						class="rounded-full px-6"
					>
						Speichern
					</UButton>
				</div>
			</div>
		</header>

		<!-- Loading State -->
		<div v-if="loading" class="flex items-center justify-center py-32">
			<div class="text-center space-y-4">
				<div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
				<p class="text-stone-500 font-medium">Artikel wird geladen...</p>
			</div>
		</div>

		<!-- Not Authorized State -->
		<div v-else-if="notAuthorized" class="flex items-center justify-center py-32">
			<div class="text-center space-y-6 max-w-md mx-auto px-4">
				<div class="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
					<UIcon name="i-lucide-lock" class="w-10 h-10 text-red-500" />
				</div>
				<h2 class="text-2xl font-bold">Keine Berechtigung</h2>
				<p class="text-stone-500">Du kannst nur deine eigenen Artikel bearbeiten.</p>
				<UButton color="primary" @click="navigateTo('/news')" icon="i-lucide-arrow-left">
					Zurück zu News
				</UButton>
			</div>
		</div>

		<!-- Main Content -->
		<div v-else class="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
			<div class="grid lg:grid-cols-5 gap-8">
				<!-- Form Area -->
				<div class="lg:col-span-3 space-y-8">
					<!-- Title Section -->
					<section class="bg-white dark:bg-stone-800 rounded-3xl border border-stone-200 dark:border-stone-700 shadow-xl overflow-hidden">
						<div class="px-6 py-4 border-b border-stone-100 dark:border-stone-700 flex items-center gap-3">
							<div class="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
								<UIcon name="i-lucide-type" class="w-5 h-5 text-primary" />
							</div>
							<span class="font-bold">Titel & Einleitung</span>
						</div>
						<div class="p-6 space-y-6">
							<div>
								<label class="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
									Titel <span class="text-red-500">*</span>
								</label>
								<input
									v-model="title"
									type="text"
									placeholder="z.B. Sommerfest im Lotissement"
									class="w-full px-5 py-3 text-lg font-bold bg-stone-50 dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
								/>
							</div>
							<div>
								<label class="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
									Einleitung
								</label>
								<textarea
									v-model="intro"
									placeholder="Eine kurze Zusammenfassung..."
									rows="3"
									class="w-full px-5 py-3 bg-stone-50 dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
								/>
								<p class="mt-2 text-xs text-stone-400">Wird in der Artikelübersicht angezeigt</p>
							</div>

							<div v-if="$isAdmin && authorOptions.length > 0">
								<label class="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
									Autor ändern
								</label>
								<USelectMenu
									v-model="selectedAuthor"
									:items="authorOptions"
									value-key="id"
									label-key="name"
									placeholder="Autor wählen..."
									size="lg"
									class="w-full"
									clearable
								/>
								<p class="mt-2 text-xs text-stone-400">Als Admin kannst du den Autor ändern</p>
							</div>
						</div>
					</section>

					<!-- Image & Categories Section -->
					<section class="bg-white dark:bg-stone-800 rounded-3xl border border-stone-200 dark:border-stone-700 shadow-xl overflow-hidden">
						<div class="px-6 py-4 border-b border-stone-100 dark:border-stone-700 flex items-center gap-3">
							<div class="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
								<UIcon name="i-lucide-image" class="w-5 h-5 text-primary" />
							</div>
							<span class="font-bold">Bild & Kategorien</span>
						</div>
						<div class="p-6 space-y-6">
							<div class="space-y-4">
								<label class="block text-sm font-bold text-stone-700 dark:text-stone-300">
									Titelbild
								</label>
								
								<div v-if="!image" class="bg-stone-50 dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-700">
									<UiImagePicker v-model="image" />
								</div>
								
								<div v-else class="relative group">
									<div class="aspect-video rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800">
										<img :src="image" alt="Selected image" class="w-full h-full object-cover" />
									</div>
									<div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-xl flex items-center justify-center">
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
							</div>

							<div>
								<label class="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
									Kategorien
								</label>
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
							</div>
						</div>
					</section>

					<!-- Content Section -->
					<section class="bg-white dark:bg-stone-800 rounded-3xl border border-stone-200 dark:border-stone-700 shadow-xl overflow-hidden">
						<div class="px-6 py-4 border-b border-stone-100 dark:border-stone-700 flex items-center gap-3">
							<div class="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
								<UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary" />
							</div>
							<span class="font-bold">Artikelinhalt</span>
						</div>
						<div class="p-4">
							<TiptapEditor v-model="content" />
						</div>
					</section>
				</div>

				<!-- Preview Panel -->
				<div class="lg:col-span-2">
					<div class="sticky top-28">
						<div class="bg-white dark:bg-stone-800 rounded-3xl border border-stone-200 dark:border-stone-700 shadow-xl overflow-hidden">
							<div class="px-6 py-4 border-b border-stone-100 dark:border-stone-700 flex items-center justify-between">
								<span class="text-sm font-bold text-stone-500">Vorschau</span>
								<div class="flex items-center gap-2">
									<span class="relative flex h-2 w-2">
										<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
										<span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
									</span>
									<span class="text-xs text-green-600 font-medium">Live</span>
								</div>
							</div>
							
							<div class="aspect-video relative overflow-hidden bg-stone-100 dark:bg-gray-700">
								<img :src="effectiveImage" class="w-full h-full object-cover" />
							</div>
							
							<div class="p-6 space-y-4">
								<h3 class="text-xl font-black leading-tight">
									{{ title || 'Dein Titel...' }}
								</h3>
								
								<p class="text-sm text-stone-500 leading-relaxed line-clamp-3">
									{{ intro || 'Deine Einleitung...' }}
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

								<div v-if="selectedAuthor" class="flex items-center gap-2 text-xs text-stone-500">
									<UIcon name="i-lucide-user" class="w-3.5 h-3.5" />
									<span>Autor: {{ selectedAuthor.name }}</span>
								</div>

								<div v-if="content" class="pt-4 border-t border-stone-100 dark:border-stone-700">
									<div class="flex items-center gap-2 text-xs text-stone-400">
										<UIcon name="i-lucide-file-text" class="w-4 h-4" />
										<span>{{ content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length }} Wörter</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
