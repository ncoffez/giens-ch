<script setup lang="ts">
import type { OrganisatorischesContent } from "~/types";

definePageMeta({
	middleware: ["is-logged-in"],
});

const nuxtApp = useNuxtApp();
const { token } = useAuthReady();
const toast = useAppToast();

const isAdmin = computed(() => import.meta.client ? nuxtApp.$isAdmin?.value : false);
const isEditing = ref(false);
const isSaving = ref(false);
const content = ref("");
const originalContent = ref("");

const { data, status, refresh } = await useFetch<OrganisatorischesContent>("/api/organisatorisches");

watch(data, (newData) => {
	if (newData) {
		content.value = newData.content;
		originalContent.value = newData.content;
	}
}, { immediate: true });

const startEditing = () => {
	originalContent.value = content.value;
	isEditing.value = true;
};

const cancelEditing = () => {
	content.value = originalContent.value;
	isEditing.value = false;
};

const save = async () => {
	if (!token.value) return;

	isSaving.value = true;
	try {
		await $fetch("/api/organisatorisches", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { content: content.value },
		});
		toast.success("Gespeichert", "Inhalt wurde erfolgreich gespeichert");
		isEditing.value = false;
		await refresh();
	} catch (e: unknown) {
		toast.error("Fehler", getFetchError(e) || "Speichern fehlgeschlagen");
	} finally {
		isSaving.value = false;
	}
};

useHead({
	title: "Organisatorisches",
});
</script>

<template>
	<div class="space-y-24 mb-20">
		<UiHero
			title="Organisatorisches"
			subtitle="Wichtige Informationen zur Résidence Beausoleil"
			src="/giens/gienseingangstor.webp"
			alt="Eingangstor der Résidence"
			height="h-[40vh] md:h-[50vh] min-h-[300px] md:min-h-[400px]" />

		<section class="max-w-screen-lg mx-auto px-4">
			<div class="flex items-center justify-end mb-8 gap-2">
				<template v-if="isAdmin && !isEditing">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-edit"
						@click="startEditing"
					>
						Bearbeiten
					</UButton>
				</template>
				<template v-else-if="isEditing">
					<UButton
						color="neutral"
						variant="ghost"
						@click="cancelEditing"
						:disabled="isSaving"
					>
						Abbrechen
					</UButton>
					<UButton
						color="primary"
						icon="i-lucide-save"
						:loading="isSaving"
						@click="save"
					>
						Speichern
					</UButton>
				</template>
			</div>

			<div v-if="status === 'pending'" class="flex justify-center py-12">
				<div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>

			<template v-else>
				<ClientOnly>
					<TiptapEditor v-if="isEditing" v-model="content" />
					<div v-else>
						<div
							v-if="content"
							class="prose dark:prose-invert max-w-none"
							v-html="content"
						/>
						<div v-else class="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-dashed border-stone-200 dark:border-stone-700">
							<UIcon name="i-lucide-file-text" class="w-10 h-10 mx-auto text-stone-300 mb-3" />
							<p class="text-stone-500">Kein Inhalt vorhanden</p>
							<p v-if="isAdmin" class="text-sm text-stone-400 mt-2">Klicken Sie auf "Bearbeiten" um Inhalt hinzuzufügen</p>
						</div>
					</div>
				</ClientOnly>
			</template>
		</section>
	</div>
</template>