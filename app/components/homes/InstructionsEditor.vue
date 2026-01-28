<script setup lang="ts">
const props = defineProps<{ home: any }>();
const emit = defineEmits(["refresh"]);

const { $token } = useNuxtApp();
const toast = useToast();

const form = reactive({
	checkInInfo: props.home?.checkInInfo || "",
	checkOutInfo: props.home?.checkOutInfo || "",
	mustKnows: [...(props.home?.mustKnows || [])],
});

const loading = ref(false);
const mustKnowsInput = ref("");

const addMustKnow = () => {
	const item = mustKnowsInput.value.trim();
	if (item && !form.mustKnows.includes(item)) {
		form.mustKnows.push(item);
		mustKnowsInput.value = "";
	}
};

const removeMustKnow = (index: number) => {
	form.mustKnows.splice(index, 1);
};

const save = async () => {
	try {
		loading.value = true;
		await $fetch(`/api/homes/${props.home.id}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: form,
		});
		toast.add({ title: "Anweisungen gespeichert!", color: "success" });
		emit("refresh");
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Fehler beim Speichern", color: "error" });
	} finally {
		loading.value = false;
	}
};

watch(() => props.home, (newHome) => {
	if (newHome) {
		form.checkInInfo = newHome.checkInInfo || "";
		form.checkOutInfo = newHome.checkOutInfo || "";
		form.mustKnows = [...(newHome.mustKnows || [])];
	}
}, { immediate: true });
</script>

<template>
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<div class="lg:col-span-2 space-y-6">
			<UCard>
				<template #header>
					<h3 class="text-lg font-bold flex items-center gap-2">
						<UIcon name="i-lucide-key" class="text-primary" />
						Ankunft & Abreise
					</h3>
				</template>

				<form @submit.prevent="save" class="space-y-8">
					<UFormField 
						label="Ankunft (Onboarding)" 
						description="Anweisungen für den Check-in (z.B. Strom, Wasser, Schlüssel)"
					>
						<UTextarea 
							v-model="form.checkInInfo" 
							placeholder="Beschreiben Sie hier, was bei der Ankunft zu tun ist..." 
							:rows="6" 
							class="font-mono text-sm"
						/>
					</UFormField>

					<UFormField 
						label="Abreise (Offboarding)" 
						description="Was muss vor dem Verlassen des Hauses erledigt werden?"
					>
						<UTextarea 
							v-model="form.checkOutInfo" 
							placeholder="Beschreiben Sie hier den Abreiseprozess..." 
							:rows="6" 
							class="font-mono text-sm"
						/>
					</UFormField>

					<div class="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
						<UButton type="submit" size="lg" :loading="loading" icon="i-lucide-save">
							Anweisungen speichern
						</UButton>
					</div>
				</form>
			</UCard>

			<UCard>
				<template #header>
					<h3 class="text-lg font-bold flex items-center gap-2">
						<UIcon name="i-lucide-lightbulb" class="text-primary" />
						Wichtige Hinweise (Must Knows)
					</h3>
				</template>

				<div class="space-y-6">
					<div class="flex gap-2">
						<UInput
							v-model="mustKnowsInput"
							placeholder="Einen wichtigen Hinweis hinzufügen..."
							class="flex-1"
							@keyup.enter="addMustKnow"
						/>
						<UButton type="button" variant="soft" @click="addMustKnow" icon="i-lucide-plus">
							Hinzufügen
						</UButton>
					</div>

					<div v-if="form.mustKnows.length" class="grid grid-cols-1 gap-2">
						<div
							v-for="(item, index) in form.mustKnows"
							:key="index"
							class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl group hover:border-primary/30 transition-colors"
						>
							<div class="flex items-start gap-3">
								<UIcon name="i-lucide-info" class="w-5 h-5 text-primary mt-0.5" />
								<span class="font-medium">{{ item }}</span>
							</div>
							<UButton
								color="error"
								variant="ghost"
								icon="i-lucide-trash-2"
								size="sm"
								@click="removeMustKnow(index)"
								class="opacity-0 group-hover:opacity-100 transition-opacity"
							/>
						</div>
					</div>
					<div v-else class="text-center py-8 text-gray-400 italic bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
						Noch keine wichtigen Hinweise hinterlegt.
					</div>
				</div>
			</UCard>
		</div>

		<div class="lg:col-span-1 space-y-6">
			<UCard class="bg-primary-50/50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800">
				<h3 class="font-black text-primary mb-2 flex items-center gap-2">
					<UIcon name="i-lucide-info" />
					Tipp
				</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
					Gute Anweisungen reduzieren Rückfragen von Gästen erheblich. Beschreiben Sie technische Details (wie den Sicherungskasten oder den Haupthahn) so genau wie möglich.
				</p>
			</UCard>
		</div>
	</div>
</template>
