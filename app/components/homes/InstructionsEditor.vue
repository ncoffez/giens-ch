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
	<div class="space-y-16">
		<form @submit.prevent="save" class="space-y-12">
			<div class="grid grid-cols-1 gap-12">
				<UFormField 
					label="Ankunft (Onboarding)" 
					description="Anweisungen für den Check-in (z.B. Strom, Wasser, Schlüssel)"
				>
					<UTextarea 
						v-model="form.checkInInfo" 
						placeholder="Beschreiben Sie hier, was bei der Ankunft zu tun ist..." 
						:rows="6" 
						size="xl"
						class="font-sans"
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
						size="xl"
						class="font-sans"
					/>
				</UFormField>
			</div>

			<div class="flex justify-end pt-4">
				<UButton type="submit" size="xl" :loading="loading" icon="i-lucide-save" class="rounded-full px-8">
					An-/Abreise speichern
				</UButton>
			</div>
		</form>

		<div class="pt-12 border-t border-stone-100 dark:border-stone-800 space-y-8">
			<div>
				<h3 class="text-xl font-bold">Wichtige Hinweise (Must Knows)</h3>
				<p class="text-sm text-stone-500">Schnelle Fakten, die jeder Gast sofort sehen sollte.</p>
			</div>

			<div class="space-y-6">
				<div class="flex gap-2">
					<UInput
						v-model="mustKnowsInput"
						placeholder="Einen wichtigen Hinweis hinzufügen..."
						size="lg"
						class="flex-1"
						@keyup.enter="addMustKnow"
					/>
					<UButton type="button" size="lg" variant="soft" @click="addMustKnow" icon="i-lucide-plus" class="rounded-xl">
						Hinzufügen
					</UButton>
				</div>

				<div v-if="form.mustKnows.length" class="grid grid-cols-1 gap-3">
					<div
						v-for="(item, index) in form.mustKnows"
						:key="index"
						class="flex items-center justify-between p-5 bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 rounded-2xl group hover:border-primary/30 transition-all"
					>
						<div class="flex items-start gap-4">
							<div class="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
							<span class="font-bold text-stone-700 dark:text-stone-300">{{ item }}</span>
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
				<div v-else class="text-center py-12 text-stone-400 italic bg-gray-50/30 dark:bg-stone-900/10 rounded-3xl border-2 border-dashed border-stone-100 dark:border-stone-800">
					Noch keine wichtigen Hinweise hinterlegt.
				</div>
			</div>
		</div>
	</div>
</template>
