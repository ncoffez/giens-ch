<script lang="ts" setup>
definePageMeta({
	middleware: ["is-publisher"],
});

const content = ref("");
const title = ref("");
const intro = ref("");
const image = ref("");
const selectedTags = ref<string[]>([]);

const toast = useToast();
const { $token, $currentUser } = useNuxtApp();

const { data: labels } = await useFetch<any[]>("/api/labels");
const tagOptions = computed(() => labels.value?.map(l => ({ id: l.id, label: l.id })) || []);

const isPublishing = ref(false);

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
				image: image.value,
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
</script>

<template>
	<div class="max-w-screen-lg mx-auto px-4 py-8 space-y-8">
		<nav class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">Neuer Artikel</h1>
			<div class="flex gap-2">
				<UButton color="neutral" variant="ghost" @click="navigateTo('/news')">Abbrechen</UButton>
				<UButton color="primary" :loading="isPublishing" @click="publish">Veröffentlichen</UButton>
			</div>
		</nav>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<UFormField label="Titel" required>
				<UInput v-model="title" placeholder="Ein aussagekräftiger Titel" class="w-full" />
			</UFormField>
			<UFormField label="Bild URL">
				<UInput v-model="image" placeholder="https://..." class="w-full" />
			</UFormField>
		</div>

		<UFormField label="Einleitung">
			<UTextarea v-model="intro" placeholder="Kurze Zusammenfassung..." class="w-full" />
		</UFormField>

		<UFormField label="Kategorien">
			<USelectMenu
				v-model="selectedTags"
				multiple
				:items="tagOptions"
				value-key="id"
				label-key="label"
				placeholder="Kategorien wählen..."
				class="w-full"
			/>
		</UFormField>

		<div class="border rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
			<TiptapEditor v-model="content" />
		</div>
	</div>
</template>

<style scoped></style>
