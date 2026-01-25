<script lang="ts" setup>
import { doc, updateDoc } from "firebase/firestore";

const { $db } = useNuxtApp();
const toast = useToast();
const { data: labels, status, refresh } = useFetch<any[]>("/api/labels");

const updateLabel = async (id: string, currentPrivacy: boolean) => {
	try {
		await updateDoc(doc($db, `labels/${id}`), { private: !currentPrivacy });
		toast.add({
			title: "Aktualisiert",
			description: `Sichtbarkeit für '${id}' wurde geändert.`,
			color: "success"
		});
		await refresh();
	} catch (error: any) {
		toast.add({
			title: "Fehler",
			description: error.message,
			color: "error"
		});
	}
};
</script>

<template>
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<h2 class="text-3xl font-extrabold tracking-tight">Kategorien & Berechtigungen</h2>
		</div>

		<UCard :ui="{ body: { padding: 'p-0' } }" class="overflow-hidden rounded-2xl shadow-lg border-gray-100 dark:border-gray-800">
			<div class="divide-y divide-gray-100 dark:divide-gray-800">
				<div v-for="label of labels" :key="label.id" class="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
					<div class="flex flex-col gap-1">
						<span class="text-xl font-bold text-gray-900 dark:text-white capitalize">{{ label.name || label.id }}</span>
						<span class="text-sm text-gray-400 font-medium tracking-wide">ID: {{ label.id }}</span>
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
					<UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-gray-400" />
				</div>
			</div>
		</UCard>
	</div>
</template>
