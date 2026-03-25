<script lang="ts" setup>
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";

const { $ensureFirestore } = useNuxtApp();
const toast = useToast();
const { data: labels, status, refresh } = useFetch<any[]>("/api/labels");

const isCreatingLabel = ref(false);
const newLabelId = ref("");
const isPending = ref(false);

const updateLabel = async (id: string, currentPrivacy: boolean) => {
	try {
		const db = await $ensureFirestore();
		await updateDoc(doc(db, `labels/${id}`), { private: !currentPrivacy });
		toast.add({
			title: "Aktualisiert",
			description: `Sichtbarkeit für '${id}' wurde geändert.`,
			color: "success"
		});
		await refresh();
	} catch (error: unknown) {
		toast.add({
			title: "Fehler",
			description: error.message,
			color: "error"
		});
	}
};

const createLabel = async () => {
	if (!newLabelId.value || newLabelId.value.trim().length < 2) {
		toast.add({
			title: "Fehler",
			description: "Label-ID muss mindestens 2 Zeichen haben.",
			color: "error"
		});
		return;
	}

	isPending.value = true;
	try {
		const db = await $ensureFirestore();
		const labelId = newLabelId.value.trim().toLowerCase();
		const labelTitle = labelId.charAt(0).toUpperCase() + labelId.slice(1);
		
		await addDoc(collection(db, "labels"), {
			id: labelId,
			title: labelTitle,
			name: labelId,
			private: false
		});
		
		toast.add({
			title: "Erfolgreich",
			description: `Label '${labelTitle}' wurde erstellt.`,
			color: "success"
		});
		newLabelId.value = "";
		isCreatingLabel.value = false;
		await refresh();
	} catch (error: unknown) {
		toast.add({
			title: "Fehler",
			description: error.message,
			color: "error"
		});
	} finally {
		isPending.value = false;
	}
};
</script>

<template>
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)] mb-2">Labels</p>
				<h2 class="display-copy text-4xl font-bold tracking-[-0.04em]">Kategorien und Sichtbarkeit</h2>
			</div>
		</div>

		<!-- Create Label Form -->
		<div class="rounded-2xl px-0 py-0 md:rounded-[1.5rem] md:border md:border-[var(--app-border)] md:bg-white/70 md:px-4 md:py-4 md:dark:bg-white/[0.03]">
			<div v-if="isCreatingLabel" class="mb-4 flex items-center justify-between px-1">
				<span class="text-lg font-bold">Neues Label erstellen</span>
				<UButton icon="i-lucide-x" variant="ghost" color="neutral" size="sm" @click="isCreatingLabel = false" />
			</div>

			<div v-if="!isCreatingLabel">
				<UButton icon="i-lucide-plus" color="neutral" variant="outline" @click="isCreatingLabel = true">
					Neues Label erstellen
				</UButton>
			</div>
			
			<div v-else class="space-y-4">
				<UFormField label="Label-ID" size="lg">
					<UInput v-model="newLabelId" placeholder="z.B. sonderangebote" @keyup.enter="createLabel" />
				</UFormField>
				<div class="flex gap-2">
					<UButton color="primary" :loading="isPending" @click="createLabel">
						Erstellen
					</UButton>
					<UButton variant="ghost" color="neutral" @click="isCreatingLabel = false">
						Abbrechen
					</UButton>
				</div>
			</div>
		</div>

		<div class="-mx-3 overflow-hidden md:mx-0 md:rounded-[1.75rem] md:border md:border-[var(--app-border)] md:bg-white/70 md:dark:bg-white/[0.03]">
			<div class="divide-y divide-gray-100 dark:divide-gray-800">
				<div v-for="label of labels" :key="label.id" class="flex items-center justify-between p-6 hover:bg-stone-50 dark:hover:bg-gray-900/50 transition-colors">
					<div class="flex flex-col gap-1">
						<span class="text-xl font-bold text-gray-900 dark:text-white capitalize">{{ label.name || label.id }}</span>
						<span class="text-sm text-stone-400 font-medium tracking-wide">ID: {{ label.id }}</span>
					</div>
					<div class="flex items-center gap-6">
						<UBadge :color="label.private ? 'warning' : 'info'" variant="subtle" size="md" class="px-4 py-1 rounded-full font-bold">
							{{ label.private ? 'Intern' : 'Öffentlich' }}
						</UBadge>
						<USwitch
							size="lg"
							:model-value="label.private"
							@update:model-value="updateLabel(label.id, label.private)" />
					</div>
				</div>
				<div v-if="status === 'pending'" class="p-12 flex justify-center">
					<UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-stone-400" />
				</div>
			</div>
		</div>
	</div>
</template>
