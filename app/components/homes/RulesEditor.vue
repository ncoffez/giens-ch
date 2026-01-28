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
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<div class="lg:col-span-2 space-y-6">
			<UCard>
				<template #header>
					<h3 class="text-lg font-bold flex items-center gap-2">
						<UIcon name="i-lucide-home" class="text-primary" />
						Hausregeln & Bettzeug
					</h3>
				</template>

				<form @submit.prevent="save" class="space-y-8">
					<UFormField 
						label="Hausregeln" 
						description="Allgemeine Verhaltensregeln für den Aufenthalt"
					>
						<UTextarea 
							v-model="form.houseRules" 
							placeholder="z.B. Nachtruhe ab 22 Uhr, keine Haustiere..." 
							:rows="6" 
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
						/>
					</UFormField>

					<div class="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
						<UButton type="submit" size="lg" :loading="loading" icon="i-lucide-save">
							Änderungen speichern
						</UButton>
					</div>
				</form>
			</UCard>

			<UCard>
				<template #header>
					<h3 class="text-lg font-bold flex items-center gap-2">
						<UIcon name="i-lucide-sparkles" class="text-primary" />
						Reinigungshinweise
					</h3>
				</template>

				<div class="space-y-6">
					<div class="flex gap-2">
						<UInput
							v-model="cleaningInfoInput"
							placeholder="Reinigungsschritt hinzufügen..."
							class="flex-1"
							@keyup.enter="addCleaningInfo"
						/>
						<UButton type="button" variant="soft" @click="addCleaningInfo" icon="i-lucide-plus">
							Hinzufügen
						</UButton>
					</div>

					<div v-if="form.cleaningInfo.length" class="grid grid-cols-1 gap-2">
						<div
							v-for="(item, index) in form.cleaningInfo"
							:key="index"
							class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl group"
						>
							<div class="flex items-start gap-3">
								<UIcon name="i-lucide-check-circle-2" class="w-5 h-5 text-green-500 mt-0.5" />
								<span class="font-medium">{{ item }}</span>
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
					<div v-else class="text-center py-8 text-gray-400 italic bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
						Keine spezifischen Reinigungshinweise vorhanden.
					</div>
				</div>
			</UCard>
		</div>

		<div class="lg:col-span-1">
			<UCard class="bg-primary-50/50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800">
				<h3 class="font-black text-primary mb-2 flex items-center gap-2">
					<UIcon name="i-lucide-info" />
					Hinweis
				</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
					Hier können Sie festlegen, wie das Haus verlassen werden soll. Klare Reinigungshinweise helfen dabei, das Haus für die nächsten Bewohner sauber zu halten.
				</p>
			</UCard>
		</div>
	</div>
</template>
