<script setup lang="ts">
const props = defineProps<{ home: any }>();

const { $token, $currentUser, $isAdmin } = useNuxtApp();
const toast = useToast();

const editors = ref<any[]>([]);
const loading = ref(false);
const editorEmail = ref("");
const daysToExpire = ref(7);
const shareUrl = ref<string | null>(null);
const shareCreated = ref<any | null>(null);

const fetchEditors = async () => {
	editors.value = (props.home?.editors || []).map((uid: string) => ({ uid }));
};

const addEditor = async () => {
	if (!editorEmail.value) return;

	try {
		loading.value = true;
		await $fetch(`/api/homes/${props.home.id}/editors.add`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: { email: editorEmail.value },
		});
		toast.add({ title: "Editor erfolgreich hinzugefügt", color: "green" });
		editorEmail.value = "";
		fetchEditors();
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Fehler beim Hinzufügen", color: "red" });
	} finally {
		loading.value = false;
	}
};

const removeEditor = async (editorUid: string) => {
	if (!confirm("Diesen Editor entfernen?")) return;

	try {
		loading.value = true;
		await $fetch(`/api/homes/${props.home.id}/editors.remove`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: { editorUid },
		});
		toast.add({ title: "Editor entfernt", color: "green" });
		fetchEditors();
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Fehler beim Entfernen", color: "red" });
	} finally {
		loading.value = false;
	}
};

const generateShareLink = async () => {
	try {
		loading.value = true;
		const result = await $fetch(`/api/homes/${props.home.id}/share.create`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: { daysToExpire: daysToExpire.value },
		});
		shareUrl.value = result.shareUrl;
		shareCreated.value = result;
		toast.add({ title: "Freigabelink erstellt!", color: "green" });
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Fehler beim Erstellen", color: "red" });
	} finally {
		loading.value = false;
	}
};

const copyShareLink = () => {
	if (!shareUrl.value) return;
	navigator.clipboard.writeText(shareUrl.value);
	toast.add({ title: "Link in Zwischenablage kopiert", color: "green" });
};

onMounted(fetchEditors);
</script>

<template>
	<div class="space-y-16">
		<!-- Share with Residents -->
		<div class="space-y-8">
			<div>
				<h3 class="text-xl font-bold">Mit Bewohnern teilen</h3>
				<p class="text-sm text-stone-500">Erstellen Sie einen Link, damit Gäste die Hausinfos sehen können.</p>
			</div>

			<div class="p-8 bg-stone-50 dark:bg-stone-900/50 rounded-3xl border border-stone-100 dark:border-stone-800 space-y-6">
				<div class="flex flex-col md:flex-row gap-6 items-end">
					<div class="flex-1 w-full">
						<UFormField label="Gültigkeit des Links (Tage)">
							<UInput v-model.number="daysToExpire" type="number" min="1" max="30" size="lg" />
						</UFormField>
					</div>
					<UButton :loading="loading" size="lg" icon="i-lucide-link" class="rounded-full px-8 w-full md:w-auto" @click="generateShareLink">
						Link generieren
					</UButton>
				</div>

				<div v-if="shareUrl" class="p-6 bg-white dark:bg-gray-950 rounded-2xl border border-primary/20 shadow-sm animate-in fade-in slide-in-from-top-2">
					<div class="flex items-center justify-between mb-4">
						<span class="text-sm font-bold text-primary flex items-center gap-2">
							<UIcon name="i-lucide-check-circle" />
							Freigabe-URL
						</span>
						<UButton size="sm" variant="soft" icon="i-lucide-copy" @click="copyShareLink">
							Kopieren
						</UButton>
					</div>
					<code class="block text-sm p-4 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 break-all font-mono">
						{{ shareUrl }}
					</code>
					<p v-if="shareCreated" class="mt-3 text-xs text-stone-400">
						Läuft ab am: {{ new Date(shareCreated.expiresAt).toLocaleString("de-CH") }}
					</p>
				</div>
			</div>
		</div>

		<!-- Editors -->
		<div v-if="$isAdmin.value || props.home.ownerIds?.includes($currentUser?.uid)" class="pt-12 border-t border-stone-100 dark:border-stone-800 space-y-8">
			<div>
				<h3 class="text-xl font-bold text-gray-900 dark:text-white">Editoren verwalten</h3>
				<p class="text-sm text-stone-500">Andere Nutzer können die Details dieses Hauses mitbearbeiten.</p>
			</div>

			<div class="space-y-6">
				<div class="flex gap-2">
					<UInput v-model="editorEmail" placeholder="E-Mail-Adresse des Editors" size="lg" class="flex-1" />
					<UButton :loading="loading" size="lg" variant="soft" class="rounded-xl px-6" @click="addEditor">Hinzufügen</UButton>
				</div>

				<div v-if="editors.length" class="grid grid-cols-1 gap-3">
					<div
						v-for="editor in editors"
						:key="editor.uid"
						class="flex items-center justify-between p-5 bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 rounded-2xl group"
					>
						<div class="flex items-center gap-4">
							<div class="p-2 bg-white dark:bg-stone-800 rounded-full shadow-sm">
								<UIcon name="i-lucide-user" class="w-5 h-5 text-stone-400" />
							</div>
							<div>
								<p class="font-bold text-sm">{{ editor.uid }}</p>
								<p class="text-[10px] uppercase font-black tracking-widest text-stone-400">Editor</p>
							</div>
						</div>
						<UButton
							color="error"
							variant="ghost"
							icon="i-lucide-user-minus"
							size="sm"
							@click="removeEditor(editor.uid)"
							class="opacity-0 group-hover:opacity-100 transition-opacity"
						/>
					</div>
				</div>
				<div v-else class="text-center py-12 bg-gray-50/30 dark:bg-stone-900/10 rounded-3xl border-2 border-dashed border-stone-100 dark:border-stone-800">
					<p class="text-sm text-stone-400 italic">Noch keine Editoren hinzugefügt.</p>
				</div>
			</div>
		</div>
	</div>
</template>
