<script setup lang="ts">
const props = defineProps<{ home: any }>();
const emit = defineEmits(["refresh"]);

const { $token } = useNuxtApp();
const toast = useToast();

const form = reactive({
	houseRules: props.home?.houseRules || "",
	blanketsInfo: props.home?.blanketsInfo || "",
	cleaningInfo: [...(props.home?.cleaningInfo || [])],
	washingMachineOverride: props.home?.washingMachineOverride || "",
});

const loading = ref(false);
const cleaningInfoInput = ref("");

const addCleaningInfo = () => {
	const item = cleaningInfoInput.value.trim();
	if (item && !form.cleaningInfo.includes(item)) {
		form.cleaningInfo.push(item);
		cleaningInfoInput.value = "";
	}
};

const removeCleaningInfo = (index: number) => {
	form.cleaningInfo.splice(index, 1);
};

const save = async () => {
	try {
		loading.value = true;
		await $fetch(`/api/homes/${props.home.id}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: form,
		});
		toast.add({ title: "Regeln & Info gespeichert!", color: "success" });
		emit("refresh");
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Fehler beim Speichern", color: "error" });
	} finally {
		loading.value = false;
	}
};

watch(() => props.home, (newHome) => {
	if (newHome) {
		form.houseRules = newHome.houseRules || "";
		form.blanketsInfo = newHome.blanketsInfo || "";
		form.cleaningInfo = [...(newHome.cleaningInfo || [])];
		form.washingMachineOverride = newHome.washingMachineOverride || "";
	}
}, { immediate: true });
</script>

<template>
	<div class="space-y-16">
		<form @submit.prevent="save" class="space-y-12">
			<div class="grid grid-cols-1 gap-12">
				<UFormField 
					label="Hausregeln" 
					description="Allgemeine Verhaltensregeln für den Aufenthalt"
				>
					<UTextarea 
						v-model="form.houseRules" 
						placeholder="z.B. Nachtruhe ab 22 Uhr, keine Haustiere..." 
						:rows="6" 
						size="xl"
					/>
				</UFormField>

				<UFormField 
					label="Bettdecken & Bettwäsche" 
					description="Informationen zur Aufbewahrung oder Mitnahme von Bettzeug"
				>
					<UTextarea 
						v-model="form.blanketsInfo" 
						placeholder="z.B. Bettwäsche bitte selbst mitbringen..." 
						:rows="4" 
						size="xl"
					/>
				</UFormField>

				<UFormField 
					label="Waschmaschinen-Hinweise" 
					description="Optionale spezifische Anweisungen für die Waschmaschine"
				>
					<UTextarea 
						v-model="form.washingMachineOverride" 
						placeholder="Lassen Sie dies leer, um die Standard-Anweisungen zu verwenden..." 
						:rows="4" 
						size="xl"
					/>
				</UFormField>
			</div>

			<div class="flex justify-end pt-4">
				<UButton type="submit" size="xl" :loading="loading" icon="i-lucide-save" class="rounded-full px-8">
					Hausregeln speichern
				</UButton>
			</div>
		</form>

		<div class="pt-12 border-t border-stone-100 dark:border-stone-800 space-y-8">
			<div>
				<h3 class="text-xl font-bold">Reinigungshinweise</h3>
				<p class="text-sm text-stone-500">Dinge, die vor der Abreise gereinigt werden müssen.</p>
			</div>

			<div class="space-y-6">
				<div class="flex gap-2">
					<UInput
						v-model="cleaningInfoInput"
						placeholder="Reinigungsschritt hinzufügen..."
						size="lg"
						class="flex-1"
						@keyup.enter="addCleaningInfo"
					/>
					<UButton type="button" size="lg" variant="soft" @click="addCleaningInfo" icon="i-lucide-plus" class="rounded-xl">
						Hinzufügen
					</UButton>
				</div>

				<div v-if="form.cleaningInfo.length" class="grid grid-cols-1 gap-3">
					<div
						v-for="(item, index) in form.cleaningInfo"
						:key="index"
						class="flex items-center justify-between p-5 bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 rounded-2xl group hover:border-primary/30 transition-all"
					>
						<div class="flex items-start gap-4 text-stone-700 dark:text-stone-300">
							<UIcon name="i-lucide-check-circle-2" class="w-5 h-5 text-green-500 mt-0.5" />
							<span class="font-bold">{{ item }}</span>
						</div>
						<UButton
							color="error"
							variant="ghost"
							icon="i-lucide-trash-2"
							size="sm"
							@click="removeCleaningInfo(index)"
							class="opacity-0 group-hover:opacity-100 transition-opacity"
						/>
					</div>
				</div>
				<div v-else class="text-center py-12 text-stone-400 italic bg-gray-50/30 dark:bg-stone-900/10 rounded-3xl border-2 border-dashed border-stone-100 dark:border-stone-800">
					Keine spezifischen Reinigungshinweise vorhanden.
				</div>
			</div>
		</div>
	</div>
</template>
